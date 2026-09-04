import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AccountKind,
  EntryDirection,
  GameSessionStatus,
  PlayerStatus,
  Prisma,
  SettlementResult,
  WagerStatus,
} from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { runSerializableWithRetry } from "../database/serializable.js";
import { payoutFor, validateBet } from "./domain-policy.js";
@Injectable()
export class GamesService {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(LedgerService) private ledger: LedgerService,
  ) {}
  private gameView<T extends { minBet: bigint; maxBet: bigint }>(game: T) {
    return {
      ...game,
      minBet: game.minBet.toString(),
      maxBet: game.maxBet.toString(),
    };
  }
  async catalog() {
    return (
      await this.db.game.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      })
    ).map((game) => this.gameView(game));
  }
  async game(slug: string) {
    const game = await this.db.game.findFirst({
      where: { slug, active: true },
    });
    if (!game)
      throw new ApplicationError("GAME_NOT_FOUND", "Game not found", 404);
    return this.gameView(game);
  }
  async createSession(userId: string, slug: string, correlationId: string) {
    const game = await this.db.game.findUnique({ where: { slug } });
    if (!game)
      throw new ApplicationError("GAME_NOT_FOUND", "Game not found", 404);
    if (!game.active)
      throw new ApplicationError("GAME_INACTIVE", "Game is inactive", 409);
    const profile = await this.db.playerProfile.findUniqueOrThrow({
      where: { userId },
    });
    this.assertActive(profile.status);
    return this.db.$transaction(async (tx) => {
      const session = await tx.gameSession.create({
        data: {
          userId,
          gameId: game.id,
          status: GameSessionStatus.ACTIVE,
          providerSessionId: `demo-session-${randomUUID()}`,
        },
        include: { game: true },
      });
      await tx.auditEvent.create({
        data: {
          actorId: userId,
          subjectId: session.id,
          action: "GAME_SESSION_CREATE",
          outcome: "SUCCESS",
          correlationId,
          metadata: { gameSlug: slug, demo: "true" },
        },
      });
      return session;
    });
  }
  sessions(userId: string) {
    return this.db.gameSession.findMany({
      where: { userId },
      include: { game: true, wagers: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  async session(userId: string, id: string) {
    const result = await this.db.gameSession.findFirst({
      where: { id, userId },
      include: { game: true, wagers: true },
    });
    if (!result)
      throw new ApplicationError("SESSION_NOT_FOUND", "Session not found", 404);
    return result;
  }
  async cancelSession(userId: string, id: string, correlationId: string) {
    return runSerializableWithRetry(this.db, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "GameSession" WHERE "id"=${id}::uuid FOR UPDATE`;
      const session = await tx.gameSession.findFirst({
        where: { id, userId },
        include: { wagers: true },
      });
      if (!session)
        throw new ApplicationError(
          "SESSION_NOT_FOUND",
          "Session not found",
          404,
        );
      if (session.status !== GameSessionStatus.ACTIVE)
        throw new ApplicationError(
          "SESSION_NOT_ACTIVE",
          "Only an active session can be cancelled",
          409,
        );
      if (session.wagers.some((wager) => wager.status === WagerStatus.ACCEPTED))
        throw new ApplicationError(
          "SESSION_HAS_OPEN_WAGER",
          "Session has an open wager",
          409,
        );
      const updated = await tx.gameSession.update({
        where: { id },
        data: { status: GameSessionStatus.CANCELLED, completedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          actorId: userId,
          subjectId: id,
          action: "GAME_SESSION_CANCEL",
          outcome: "SUCCESS",
          correlationId,
          metadata: {},
        },
      });
      return updated;
    });
  }
  async wager(
    userId: string,
    sessionId: string,
    stakeText: string,
    key: string,
    correlationId: string,
  ) {
    const stake = BigInt(stakeText);
    return runSerializableWithRetry(this.db, async (tx) => {
      const existing = await tx.gameWager.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
        include: { game: true },
      });
      if (existing) {
        if (existing.sessionId !== sessionId || existing.stake !== stake)
          throw new ApplicationError(
            "IDEMPOTENCY_CONFLICT",
            "Idempotency key has different input",
            409,
          );
        return this.wagerView(existing);
      }
      const session = await tx.gameSession.findFirst({
        where: { id: sessionId, userId },
        include: { game: true, user: { include: { profile: true } } },
      });
      if (!session)
        throw new ApplicationError(
          "SESSION_NOT_FOUND",
          "Session not found",
          404,
        );
      if (session.status !== GameSessionStatus.ACTIVE)
        throw new ApplicationError(
          "SESSION_INACTIVE",
          "Session is not active",
          409,
        );
      if (!session.game.active)
        throw new ApplicationError("GAME_INACTIVE", "Game is inactive", 409);
      this.assertActive(session.user.profile?.status);
      if (!validateBet(stake, session.game.minBet, session.game.maxBet))
        throw new ApplicationError(
          "BET_OUT_OF_RANGE",
          "Stake is outside game limits",
          422,
        );
      const player = await tx.ledgerAccount.findUniqueOrThrow({
        where: {
          userId_assetCode_kind: {
            userId,
            assetCode: "TSC",
            kind: AccountKind.PLAYER_AVAILABLE,
          },
        },
      });
      const escrow = await tx.ledgerAccount.findFirstOrThrow({
        where: {
          userId: null,
          assetCode: "TSC",
          kind: AccountKind.GAME_ESCROW,
        },
      });
      const ledgerTx = await this.ledger.postWithin(tx, {
        scope: `wager:${userId}`,
        idempotencyKey: key,
        type: "GAME_WAGER",
        actorId: userId,
        referenceId: sessionId,
        correlationId,
        entries: [
          {
            accountId: player.id,
            direction: EntryDirection.DEBIT,
            amount: stake,
          },
          {
            accountId: escrow.id,
            direction: EntryDirection.CREDIT,
            amount: stake,
          },
        ],
      });
      const wager = await tx.gameWager.create({
        data: {
          sessionId,
          userId,
          gameId: session.gameId,
          idempotencyKey: key,
          stake,
          status: WagerStatus.ACCEPTED,
          providerRoundId: `demo-round-${randomUUID()}`,
          ledgerTransactionId: ledgerTx.id,
        },
        include: { game: true },
      });
      return this.wagerView(wager);
    });
  }
  async settle(
    wagerId: string,
    key: string,
    actorId: string,
    correlationId: string,
    scenario?: SettlementResult,
  ) {
    return runSerializableWithRetry(this.db, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "GameWager" WHERE "id"=${wagerId}::uuid FOR UPDATE`;
      return this.settleWithin(
        tx,
        wagerId,
        key,
        actorId,
        correlationId,
        scenario,
      );
    });
  }
  async settleWithin(
    tx: Prisma.TransactionClient,
    wagerId: string,
    key: string,
    actorId: string,
    correlationId: string,
    scenario?: SettlementResult,
  ) {
    const wager = await tx.gameWager.findUnique({ where: { id: wagerId } });
    if (!wager)
      throw new ApplicationError("WAGER_NOT_FOUND", "Wager not found", 404);
    if (
      wager.status === WagerStatus.SETTLED ||
      wager.status === WagerStatus.REFUNDED
    ) {
      if (wager.settlementKey === key) return this.wagerView(wager);
      throw new ApplicationError(
        "WAGER_ALREADY_SETTLED",
        "Wager is already settled",
        409,
      );
    }
    const result = scenario ?? SettlementResult.LOSS;
    const payout = payoutFor(result, wager.stake);
    const escrow = await tx.ledgerAccount.findFirstOrThrow({
      where: {
        userId: null,
        assetCode: "TSC",
        kind: AccountKind.GAME_ESCROW,
      },
    });
    const treasury = await tx.ledgerAccount.findFirstOrThrow({
      where: {
        userId: null,
        assetCode: "TSC",
        kind: AccountKind.PLATFORM_TREASURY,
      },
    });
    const player = await tx.ledgerAccount.findUniqueOrThrow({
      where: {
        userId_assetCode_kind: {
          userId: wager.userId,
          assetCode: "TSC",
          kind: AccountKind.PLAYER_AVAILABLE,
        },
      },
    });
    const entries =
      result === SettlementResult.REFUND
        ? [
            {
              accountId: escrow.id,
              direction: EntryDirection.DEBIT,
              amount: wager.stake,
            },
            {
              accountId: player.id,
              direction: EntryDirection.CREDIT,
              amount: wager.stake,
            },
          ]
        : [
            {
              accountId: escrow.id,
              direction: EntryDirection.DEBIT,
              amount: wager.stake,
            },
            {
              accountId: treasury.id,
              direction: EntryDirection.CREDIT,
              amount: wager.stake,
            },
            ...(payout > 0n
              ? [
                  {
                    accountId: treasury.id,
                    direction: EntryDirection.DEBIT,
                    amount: payout,
                  },
                  {
                    accountId: player.id,
                    direction: EntryDirection.CREDIT,
                    amount: payout,
                  },
                ]
              : []),
          ];
    const ledgerTx = await this.ledger.postWithin(tx, {
      scope: "settlement",
      idempotencyKey: key,
      type:
        result === SettlementResult.REFUND ? "GAME_REFUND" : "GAME_SETTLEMENT",
      actorId,
      referenceId: wager.id,
      correlationId,
      entries,
    });
    const updated = await tx.gameWager.update({
      where: { id: wager.id },
      data: {
        status:
          result === SettlementResult.REFUND
            ? WagerStatus.REFUNDED
            : WagerStatus.SETTLED,
        result,
        payout,
        settledAt: new Date(),
        settlementKey: key,
        settlementLedgerTransactionId: ledgerTx.id,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        subjectId: wager.id,
        action: "WAGER_SETTLE",
        outcome: "SUCCESS",
        correlationId,
        metadata: { result, payout: payout.toString() },
      },
    });
    return this.wagerView(updated);
  }
  private assertActive(status?: PlayerStatus) {
    if (status !== PlayerStatus.ACTIVE)
      throw new ApplicationError(
        status === PlayerStatus.FROZEN ? "ACCOUNT_FROZEN" : "ACCOUNT_SUSPENDED",
        "Account cannot perform this action",
        403,
      );
  }
  private wagerView<T extends { stake: bigint; payout: bigint | null }>(w: T) {
    return {
      ...w,
      stake: w.stake.toString(),
      payout: w.payout?.toString() ?? null,
      demo: true,
    };
  }
}
