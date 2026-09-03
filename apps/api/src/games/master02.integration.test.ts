import { randomUUID } from "node:crypto";
import {
  AccountKind,
  PlayerStatus,
  ProviderEventType,
  RoleName,
  SettlementResult,
} from "@cg/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AdminService } from "../admin/admin.service.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { PlayerService } from "../player/player.service.js";
import { GamesService } from "./games.service.js";
import { ProviderService } from "../provider/provider.service.js";
import { DemoProviderAdapter } from "../provider/demo-provider.adapter.js";
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("MASTER-02 PostgreSQL vertical slice", () => {
  let db: DatabaseService,
    ledger: LedgerService,
    player: PlayerService,
    games: GamesService,
    admin: AdminService,
    provider: ProviderService,
    userId: string,
    adminId: string;
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.APP_MODE = "test";
    db = new DatabaseService();
    await db.$connect();
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "AuditEvent", "IdempotencyRecord", "LedgerEntry", "GameWager", "GameSession", "DemoFaucetClaim", "Game", "LedgerTransaction", "LedgerAccount", "PlayerProfile", "Session", "UserRole", "User", "Role", "Asset" CASCADE',
    );
    await db.asset.create({
      data: { code: "TSC", name: "Test Satoshi Credit" },
    });
    await db.role.createMany({
      data: [{ name: RoleName.PLAYER }, { name: RoleName.ADMIN }],
    });
    const users = await Promise.all([
      db.user.create({
        data: {
          email: "m02-player@example.invalid",
          passwordHash: "test",
          profile: { create: {} },
          accounts: {
            create: { assetCode: "TSC", kind: AccountKind.PLAYER_AVAILABLE },
          },
        },
      }),
      db.user.create({
        data: { email: "m02-admin@example.invalid", passwordHash: "test" },
      }),
    ]);
    userId = users[0].id;
    adminId = users[1].id;
    for (const kind of [
      AccountKind.TEST_FAUCET,
      AccountKind.PLATFORM_TREASURY,
      AccountKind.GAME_ESCROW,
    ])
      await db.ledgerAccount.create({
        data: {
          assetCode: "TSC",
          kind,
          allowNegative: kind !== AccountKind.GAME_ESCROW,
        },
      });
    await db.game.create({
      data: {
        slug: "integration-dice",
        name: "Integration Dice",
        provider: "CG Simulator",
        category: "TEST",
        minBet: 100n,
        maxBet: 1000n,
      },
    });
    ledger = new LedgerService(db);
    player = new PlayerService(db, ledger);
    games = new GamesService(db, ledger);
    admin = new AdminService(db, ledger);
    provider = new ProviderService(db, new DemoProviderAdapter(), games);
  });
  afterAll(async () => db.$disconnect());

  it("claims once through balanced ledger, isolates wallet history, and enforces cooldown", async () => {
    const key = randomUUID(),
      claim = await player.faucet(userId, key, "integration");
    expect(claim.amount).toBe("100000");
    expect((await player.faucet(userId, key, "integration")).duplicate).toBe(
      true,
    );
    await expect(
      player.faucet(userId, randomUUID(), "integration"),
    ).rejects.toMatchObject({ code: "FAUCET_COOLDOWN" });
    expect((await player.wallet(userId)).available).toBe("100000");
    expect((await player.transactions(userId)).items).toHaveLength(1);
  });
  it("uses escrow for wager, blocks frozen players, and prevents duplicate settlement", async () => {
    const session = await games.createSession(
      userId,
      "integration-dice",
      "integration",
    );
    const wager = await games.wager(
      userId,
      session.id,
      "100",
      randomUUID(),
      "integration",
    );
    expect(wager.status).toBe("ACCEPTED");
    await admin.status(userId, PlayerStatus.FROZEN, adminId, "integration");
    await expect(
      games.wager(userId, session.id, "100", randomUUID(), "integration"),
    ).rejects.toMatchObject({ code: "ACCOUNT_FROZEN" });
    await admin.status(userId, PlayerStatus.ACTIVE, adminId, "integration");
    const settlementKey = randomUUID();
    const results = await Promise.allSettled([
      games.settle(wager.id, settlementKey, adminId, "integration"),
      games.settle(wager.id, settlementKey, adminId, "integration"),
    ]);
    expect(
      results.filter((x) => x.status === "fulfilled").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      await db.ledgerTransaction.count({ where: { referenceId: wager.id } }),
    ).toBe(1);
    await expect(
      games.settle(wager.id, randomUUID(), adminId, "integration"),
    ).rejects.toMatchObject({ code: "WAGER_ALREADY_SETTLED" });
  });
  it("previews, confirms once, audits once, and corrects by compensation", async () => {
    const preview = await admin.previewGrant(
      userId,
      "500",
      "Integration grant",
      "TICKET-1",
      adminId,
      "integration",
    );
    const credit = await admin.confirmGrant(
      preview.id,
      preview.payloadHash,
      "admin-credit-0001",
      adminId,
      "integration",
    );
    const duplicate = await admin.confirmGrant(
      preview.id,
      preview.payloadHash,
      "admin-credit-0001",
      adminId,
      "integration",
    );
    expect(duplicate.transactionId).toBe(credit.transactionId);
    expect(
      await db.auditEvent.count({ where: { action: "TEST_FUNDS_GRANT" } }),
    ).toBe(1);
    const correction = await admin.correct(
      credit.transactionId,
      "Integration correction",
      "TICKET-2",
      "admin-correction-0001",
      adminId,
      "integration",
    );
    expect(correction.compensatesId).toBe(credit.transactionId);
    expect(
      await db.ledgerTransaction.findUniqueOrThrow({
        where: { id: correction.transactionId },
      }),
    ).toMatchObject({ compensatesId: credit.transactionId });
  });
  it("authenticates, deduplicates, rejects conflicts and processes configured provider callbacks", async () => {
    const game = await db.game.findUniqueOrThrow({
      where: { slug: "integration-dice" },
    });
    await provider.configure(
      game.id,
      SettlementResult.WIN_SMALL,
      adminId,
      "provider",
    );
    const session = await games.createSession(
        userId,
        "integration-dice",
        "provider",
      ),
      wager = await games.wager(
        userId,
        session.id,
        "100",
        "provider-wager",
        "provider",
      );
    const adapter = new DemoProviderAdapter();
    const commit = {
      eventId: "provider-commit-0001",
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.COMMIT,
    };
    await provider.process(commit, adapter.sign(commit), adminId, "provider");
    const callback = {
      eventId: "provider-event-0001",
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.SETTLE,
      scenario: SettlementResult.WIN_SMALL,
    };
    await expect(
      provider.process(callback, "bad", adminId, "provider"),
    ).rejects.toMatchObject({ code: "PROVIDER_AUTH_INVALID" });
    const first = await provider.process(
      callback,
      adapter.sign(callback),
      adminId,
      "provider",
    );
    expect(first.eventId).toBe(callback.eventId);
    expect(
      await provider.process(
        callback,
        adapter.sign(callback),
        adminId,
        "provider",
      ),
    ).toMatchObject({ duplicate: true });
    const conflict = { ...callback, scenario: SettlementResult.LOSS };
    await expect(
      provider.process(conflict, adapter.sign(conflict), adminId, "provider"),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("covers LOSS, WIN_SMALL, WIN_LARGE, REFUND and callback ordering/ownership", async () => {
    const game = await db.game.findUniqueOrThrow({
        where: { slug: "integration-dice" },
      }),
      adapter = new DemoProviderAdapter();
    for (const scenario of [
      SettlementResult.LOSS,
      SettlementResult.WIN_SMALL,
      SettlementResult.WIN_LARGE,
      SettlementResult.REFUND,
    ]) {
      await provider.configure(game.id, scenario, adminId, "scenarios");
      const session = await games.createSession(
          userId,
          "integration-dice",
          "scenarios",
        ),
        wager = await games.wager(
          userId,
          session.id,
          "100",
          `scenario-${scenario}`,
          "scenarios",
        );
      const result = await provider.simulate(wager.id, adminId, "scenarios");
      expect(result.settled?.result).toBe(scenario);
      expect(
        (await db.gameSession.findUniqueOrThrow({ where: { id: session.id } }))
          .status,
      ).toBe("COMPLETED");
    }
    const session = await games.createSession(
        userId,
        "integration-dice",
        "ordering",
      ),
      wager = await games.wager(
        userId,
        session.id,
        "100",
        "ordering-wager",
        "ordering",
      );
    const settle = {
      eventId: "ordering-settle",
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.SETTLE,
      scenario: SettlementResult.LOSS,
    };
    await expect(
      provider.process(settle, adapter.sign(settle), adminId, "ordering"),
    ).rejects.toMatchObject({ code: "PROVIDER_EVENT_OUT_OF_ORDER" });
    const wrongSession = {
      ...settle,
      eventId: "wrong-session",
      providerSessionId: "demo-session-wrong",
    };
    await expect(
      provider.process(
        wrongSession,
        adapter.sign(wrongSession),
        adminId,
        "ordering",
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_SESSION_MISMATCH" });
    const wrongWager = {
      ...settle,
      eventId: "wrong-wager",
      providerRoundId: "demo-round-missing",
    };
    await expect(
      provider.process(
        wrongWager,
        adapter.sign(wrongWager),
        adminId,
        "ordering",
      ),
    ).rejects.toMatchObject({ code: "WAGER_NOT_FOUND" });
  });
});
