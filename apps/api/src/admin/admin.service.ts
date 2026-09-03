import { Inject, Injectable } from "@nestjs/common";
import { AccountKind, EntryDirection, PlayerStatus, Prisma } from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
@Injectable()
export class AdminService {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(LedgerService) private ledger: LedgerService,
  ) {}
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
  async adjust(
    id: string,
    direction: "credit" | "debit",
    amountText: string,
    reason: string,
    ticket: string,
    key: string,
    actorId: string,
    correlationId: string,
  ) {
    if (!["demo", "test"].includes(process.env.APP_MODE ?? "demo"))
      throw new ApplicationError(
        "DEMO_FUNDS_DISABLED",
        "Demo adjustments are disabled",
        404,
      );
    const amount = BigInt(amountText);
    if (amount > 1_000_000n)
      throw new ApplicationError(
        "ADJUSTMENT_LIMIT",
        "Adjustment exceeds the demo limit",
        422,
      );
    return this.db.$transaction(
      async (tx) => {
        const player = await tx.ledgerAccount.findUnique({
          where: {
            userId_assetCode_kind: {
              userId: id,
              assetCode: "TSC",
              kind: AccountKind.PLAYER_AVAILABLE,
            },
          },
        });
        if (!player)
          throw new ApplicationError(
            "PLAYER_NOT_FOUND",
            "Player not found",
            404,
          );
        const treasury = await tx.ledgerAccount.findFirstOrThrow({
          where: {
            userId: null,
            assetCode: "TSC",
            kind: AccountKind.PLATFORM_TREASURY,
          },
        });
        let posted;
        try {
          posted = await this.ledger.postWithin(tx, {
            scope: `admin-${direction}:${id}`,
            idempotencyKey: key,
            type: "ADMIN_ADJUSTMENT",
            actorId,
            referenceId: ticket,
            correlationId,
            entries:
              direction === "credit"
                ? [
                    {
                      accountId: treasury.id,
                      direction: EntryDirection.DEBIT,
                      amount,
                    },
                    {
                      accountId: player.id,
                      direction: EntryDirection.CREDIT,
                      amount,
                    },
                  ]
                : [
                    {
                      accountId: player.id,
                      direction: EntryDirection.DEBIT,
                      amount,
                    },
                    {
                      accountId: treasury.id,
                      direction: EntryDirection.CREDIT,
                      amount,
                    },
                  ],
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes("Insufficient"))
            throw new ApplicationError(
              "INSUFFICIENT_FUNDS",
              "Insufficient TSC balance",
              409,
            );
          throw error;
        }
        await tx.auditEvent.create({
          data: {
            actorId,
            subjectId: id,
            action: `ADMIN_TEST_${direction.toUpperCase()}`,
            outcome: "SUCCESS",
            reason,
            correlationId,
            metadata: {
              amount: amount.toString(),
              ticket,
              transactionId: posted.id,
            },
          },
        });
        return {
          transactionId: posted.id,
          amount: amount.toString(),
          asset: "TSC",
          demo: true,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
  audit() {
    return this.db.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
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
