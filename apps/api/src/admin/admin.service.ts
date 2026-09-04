import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AccountKind, EntryDirection, PlayerStatus, RoleName } from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { runSerializableWithRetry } from "../database/serializable.js";
import { financialError } from "../common/domain-error.js";
@Injectable()
export class AdminService {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(LedgerService) private ledger: LedgerService,
  ) {}
  private demoOnly() {
    if (!["demo", "test"].includes(process.env.APP_MODE ?? "demo"))
      throw new ApplicationError(
        "DEMO_FUNDS_DISABLED",
        "Demo funds are disabled",
        404,
      );
  }
  private grantHash(
    targetId: string,
    amount: bigint,
    reason: string,
    ticket: string,
  ) {
    return createHash("sha256")
      .update(
        JSON.stringify({ targetId, amount: amount.toString(), reason, ticket }),
      )
      .digest("hex");
  }
  async previewGrant(
    targetId: string,
    amountText: string,
    reason: string,
    ticket: string,
    actorId: string,
    correlationId: string,
  ) {
    this.demoOnly();
    const amount = BigInt(amountText),
      limit = BigInt(process.env.DEMO_GRANT_LIMIT ?? "1000000");
    if (amount > limit)
      throw new ApplicationError(
        "GRANT_LIMIT",
        "Grant exceeds per-grant limit",
        422,
      );
    const player = await this.db.ledgerAccount.findUnique({
      where: {
        userId_assetCode_kind: {
          userId: targetId,
          assetCode: "TSC",
          kind: AccountKind.PLAYER_AVAILABLE,
        },
      },
    });
    if (!player)
      throw new ApplicationError("PLAYER_NOT_FOUND", "Player not found", 404);
    const treasury = await this.db.ledgerAccount.findFirstOrThrow({
      where: {
        userId: null,
        assetCode: "TSC",
        kind: AccountKind.PLATFORM_TREASURY,
      },
    });
    const payloadHash = this.grantHash(targetId, amount, reason, ticket);
    const preview = await this.db.adminGrantPreview.create({
      data: {
        actorId,
        targetId,
        amount,
        reason,
        ticket,
        payloadHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await this.db.auditEvent.create({
      data: {
        actorId,
        subjectId: preview.id,
        action: "TEST_FUNDS_GRANT_PREVIEW",
        outcome: "SUCCESS",
        reason,
        correlationId,
        metadata: { ticket, amount: amount.toString() },
      },
    });
    return {
      id: preview.id,
      payloadHash,
      expiresAt: preview.expiresAt,
      entries: [
        {
          accountId: treasury.id,
          direction: "DEBIT",
          amount: amount.toString(),
        },
        {
          accountId: player.id,
          direction: "CREDIT",
          amount: amount.toString(),
        },
      ],
      asset: "TSC",
      demo: true,
    };
  }
  async confirmGrant(
    previewId: string,
    previewHash: string,
    key: string,
    actorId: string,
    correlationId: string,
  ) {
    this.demoOnly();
    return runSerializableWithRetry(this.db, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "AdminGrantPreview" WHERE "id"=${previewId}::uuid FOR UPDATE`;
      const preview = await tx.adminGrantPreview.findUnique({
        where: { id: previewId },
      });
      if (!preview || preview.actorId !== actorId)
        throw new ApplicationError(
          "GRANT_PREVIEW_NOT_FOUND",
          "Grant preview not found",
          404,
        );
      if (preview.payloadHash !== previewHash)
        throw financialError.idempotency();
      if (preview.transactionId)
        return {
          transactionId: preview.transactionId,
          amount: preview.amount.toString(),
          duplicate: true,
        };
      if (preview.expiresAt <= new Date())
        throw new ApplicationError(
          "GRANT_PREVIEW_EXPIRED",
          "Grant preview expired",
          409,
        );
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${preview.targetId}))`;
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const daily = await tx.adminGrantPreview.aggregate({
        where: { targetId: preview.targetId, executedAt: { gte: start } },
        _sum: { amount: true },
      });
      const dailyLimit = BigInt(
        process.env.DEMO_GRANT_DAILY_LIMIT ?? "5000000",
      );
      if ((daily._sum.amount ?? 0n) + preview.amount > dailyLimit)
        throw new ApplicationError(
          "GRANT_DAILY_LIMIT",
          "Daily grant limit exceeded",
          409,
        );
      const player = await tx.ledgerAccount.findUniqueOrThrow({
        where: {
          userId_assetCode_kind: {
            userId: preview.targetId,
            assetCode: "TSC",
            kind: AccountKind.PLAYER_AVAILABLE,
          },
        },
      });
      const treasury = await tx.ledgerAccount.findFirstOrThrow({
        where: {
          userId: null,
          assetCode: "TSC",
          kind: AccountKind.PLATFORM_TREASURY,
        },
      });
      const posted = await this.ledger.postWithin(tx, {
        scope: "admin-grant",
        idempotencyKey: key,
        type: "TEST_FUNDS_GRANT",
        actorId,
        referenceId: `${preview.id}:${preview.payloadHash}:${preview.ticket}`,
        correlationId,
        entries: [
          {
            accountId: treasury.id,
            direction: EntryDirection.DEBIT,
            amount: preview.amount,
          },
          {
            accountId: player.id,
            direction: EntryDirection.CREDIT,
            amount: preview.amount,
          },
        ],
      });
      await tx.adminGrantPreview.update({
        where: { id: preview.id },
        data: { executedAt: new Date(), transactionId: posted.id },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          subjectId: preview.targetId,
          action: "TEST_FUNDS_GRANT",
          outcome: "SUCCESS",
          reason: preview.reason,
          correlationId,
          metadata: {
            ticket: preview.ticket,
            amount: preview.amount.toString(),
            transactionId: posted.id,
          },
        },
      });
      return {
        transactionId: posted.id,
        amount: preview.amount.toString(),
        duplicate: false,
      };
    });
  }
  async correct(
    originalId: string,
    reason: string,
    ticket: string,
    key: string,
    actorId: string,
    correlationId: string,
  ) {
    this.demoOnly();
    return runSerializableWithRetry(this.db, async (tx) => {
      const existing = await tx.idempotencyRecord.findUnique({
        where: { scope_key: { scope: "admin-correction", key } },
      });
      const original = await tx.ledgerTransaction.findUnique({
        where: { id: originalId },
        include: { entries: true, compensatedBy: true },
      });
      if (!original)
        throw new ApplicationError(
          "TRANSACTION_NOT_FOUND",
          "Transaction not found",
          404,
        );
      if (!["TEST_FUNDS_GRANT", "ADMIN_ADJUSTMENT"].includes(original.type))
        throw new ApplicationError(
          "TRANSACTION_NOT_CORRECTABLE",
          "Transaction requires its domain-specific correction workflow",
          409,
        );
      if (original.compensatedBy.length && !existing)
        throw new ApplicationError(
          "TRANSACTION_ALREADY_CORRECTED",
          "Transaction is already corrected",
          409,
        );
      const posted = await this.ledger.postWithin(tx, {
        scope: "admin-correction",
        idempotencyKey: key,
        type: `CORRECT_${original.type}`,
        actorId,
        referenceId: `${original.id}:${ticket}:${createHash("sha256").update(reason).digest("hex")}`,
        compensatesId: original.id,
        correlationId,
        entries: original.entries.map((entry) => ({
          accountId: entry.accountId,
          amount: entry.amount,
          direction:
            entry.direction === EntryDirection.DEBIT
              ? EntryDirection.CREDIT
              : EntryDirection.DEBIT,
        })),
      });
      if (existing)
        return {
          transactionId: posted.id,
          compensatesId: original.id,
          duplicate: true,
        };
      await tx.auditEvent.create({
        data: {
          actorId,
          subjectId: original.id,
          action: "TEST_FUNDS_CORRECTION",
          outcome: "SUCCESS",
          reason,
          correlationId,
          metadata: { ticket, transactionId: posted.id },
        },
      });
      return { transactionId: posted.id, compensatesId: original.id };
    });
  }
  async dashboard() {
    const [players, profiles, transactions, liabilityEntries] =
      await Promise.all([
        this.db.playerProfile.count(),
        this.db.playerProfile.groupBy({ by: ["status"], _count: true }),
        this.db.ledgerTransaction.groupBy({ by: ["type"], _count: true }),
        this.db.ledgerEntry.findMany({
          where: { account: { kind: AccountKind.PLAYER_AVAILABLE } },
          select: { direction: true, amount: true },
        }),
      ]);
    const liability = liabilityEntries.reduce(
      (sum, entry) =>
        sum +
        (entry.direction === EntryDirection.CREDIT
          ? entry.amount
          : -entry.amount),
      0n,
    );
    return {
      players,
      statuses: Object.fromEntries(profiles.map((x) => [x.status, x._count])),
      transactions: Object.fromEntries(
        transactions.map((x) => [x.type, x._count]),
      ),
      asset: "TSC",
      playerLiability: liability.toString(),
      limits: {
        perGrant: process.env.DEMO_GRANT_LIMIT ?? "1000000",
        daily: process.env.DEMO_GRANT_DAILY_LIMIT ?? "5000000",
      },
      demo: true,
    };
  }
  async setRole(
    userId: string,
    roleName: RoleName,
    add: boolean,
    actorId: string,
    correlationId: string,
  ) {
    return runSerializableWithRetry(this.db, async (tx) => {
      if (!add && roleName === RoleName.ADMIN)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('cg:last-admin'))`;
      const role = await tx.role.findUniqueOrThrow({
        where: { name: roleName },
      });
      if (!add && roleName === RoleName.ADMIN) {
        const admins = await tx.userRole.count({
          where: { roleId: role.id },
        });
        const target = await tx.userRole.findUnique({
          where: { userId_roleId: { userId, roleId: role.id } },
        });
        if (target && admins <= 1)
          throw new ApplicationError(
            "LAST_ADMIN",
            "The final admin role cannot be removed",
            409,
          );
      }
      if (add)
        await tx.userRole.upsert({
          where: { userId_roleId: { userId, roleId: role.id } },
          update: {},
          create: { userId, roleId: role.id },
        });
      else await tx.userRole.deleteMany({ where: { userId, roleId: role.id } });
      await tx.auditEvent.create({
        data: {
          actorId,
          subjectId: userId,
          action: add ? "ROLE_GRANT" : "ROLE_REVOKE",
          outcome: "SUCCESS",
          correlationId,
          metadata: { role: roleName },
        },
      });
      return { userId, role: roleName, assigned: add };
    });
  }
  players() {
    return this.db.user.findMany({
      where: { profile: { isNot: null } },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: true,
        roles: { select: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async player(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: true,
        roles: { select: { role: { select: { name: true } } } },
        gameSessions: {
          include: { game: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!user)
      throw new ApplicationError("PLAYER_NOT_FOUND", "Player not found", 404);
    const account = await this.db.ledgerAccount.findUnique({
      where: {
        userId_assetCode_kind: {
          userId: id,
          assetCode: "TSC",
          kind: AccountKind.PLAYER_AVAILABLE,
        },
      },
    });
    const transactions = account
      ? await this.db.ledgerEntry.findMany({
          where: { accountId: account.id },
          include: { transaction: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];
    return {
      ...user,
      transactions: transactions.map((x) => ({
        ...x,
        amount: x.amount.toString(),
      })),
    };
  }
  async status(
    id: string,
    status: PlayerStatus,
    actorId: string,
    correlationId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const profile = await tx.playerProfile.update({
        where: { userId: id },
        data: { status },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          subjectId: id,
          action: `PLAYER_${status}`,
          outcome: "SUCCESS",
          correlationId,
          metadata: {},
        },
      });
      return profile;
    });
  }
  ledgerTransactions() {
    return this.db.ledgerTransaction.findMany({
      include: {
        entries: {
          include: { account: { select: { userId: true, kind: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  audit(
    filters: {
      action?: string;
      actorId?: string;
      subjectId?: string;
      outcome?: string;
      correlationId?: string;
      from?: string;
      to?: string;
      cursor?: string;
    } = {},
  ) {
    return this.db.auditEvent.findMany({
      where: {
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.outcome ? { outcome: filters.outcome } : {}),
        ...(filters.correlationId
          ? { correlationId: filters.correlationId }
          : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 51,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });
  }
  sessions() {
    return this.db.gameSession.findMany({
      include: { game: true, user: { select: { email: true } }, wagers: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  games() {
    return this.db.game.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }
  async patchGame(
    id: string,
    input: {
      active?: boolean;
      minBet?: string;
      maxBet?: string;
      sortOrder?: number;
    },
    actorId: string,
    correlationId: string,
  ) {
    const current = await this.db.game.findUnique({ where: { id } });
    if (!current)
      throw new ApplicationError("GAME_NOT_FOUND", "Game not found", 404);
    const min = input.minBet ? BigInt(input.minBet) : current.minBet,
      max = input.maxBet ? BigInt(input.maxBet) : current.maxBet;
    if (min > max)
      throw new ApplicationError(
        "BET_OUT_OF_RANGE",
        "Minimum bet must not exceed maximum bet",
        422,
      );
    return this.db.$transaction(async (tx) => {
      const game = await tx.game.update({
        where: { id },
        data: { ...input, minBet: min, maxBet: max },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          subjectId: id,
          action: "GAME_UPDATE",
          outcome: "SUCCESS",
          correlationId,
          metadata: {
            active: String(game.active),
            minBet: min.toString(),
            maxBet: max.toString(),
          },
        },
      });
      return { ...game, minBet: min.toString(), maxBet: max.toString() };
    });
  }
}
