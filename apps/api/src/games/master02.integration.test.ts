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

  it("atomically deduplicates concurrent provider SETTLE and COMMIT callbacks", async () => {
    const adapter = new DemoProviderAdapter();
    const session = await games.createSession(
      userId,
      "integration-dice",
      "race",
    );
    const wager = await games.wager(
      userId,
      session.id,
      "100",
      randomUUID(),
      "race",
    );
    const commit = {
      eventId: `commit-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.COMMIT,
    };
    const commits = await Promise.all([
      provider.process(commit, adapter.sign(commit), adminId, "race"),
      provider.process(commit, adapter.sign(commit), adminId, "race"),
    ]);
    expect(commits.some((result) => result.duplicate)).toBe(true);
    expect(
      await db.providerEvent.count({ where: { eventId: commit.eventId } }),
    ).toBe(1);
    expect(
      await db.auditEvent.count({
        where: { subjectId: wager.id, action: "PROVIDER_COMMIT" },
      }),
    ).toBe(1);

    const settle = {
      eventId: `settle-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.SETTLE,
      scenario: SettlementResult.WIN_SMALL,
    };
    const settled = await Promise.all([
      provider.process(settle, adapter.sign(settle), adminId, "race"),
      provider.process(settle, adapter.sign(settle), adminId, "race"),
    ]);
    expect(settled.some((result) => result.duplicate)).toBe(true);
    expect(
      await db.providerEvent.count({ where: { eventId: settle.eventId } }),
    ).toBe(1);
    expect(
      await db.auditEvent.count({
        where: { subjectId: wager.id, action: "WAGER_SETTLE" },
      }),
    ).toBe(1);
  });

  it("returns a stable conflict for concurrent changed provider payloads", async () => {
    const adapter = new DemoProviderAdapter();
    const session = await games.createSession(
      userId,
      "integration-dice",
      "race-conflict",
    );
    const wager = await games.wager(
      userId,
      session.id,
      "100",
      randomUUID(),
      "race-conflict",
    );
    const commit = {
      eventId: `commit-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.COMMIT,
    };
    await provider.process(
      commit,
      adapter.sign(commit),
      adminId,
      "race-conflict",
    );
    const base = {
      eventId: `settle-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.SETTLE,
    };
    const left = { ...base, scenario: SettlementResult.LOSS };
    const right = { ...base, scenario: SettlementResult.WIN_LARGE };
    const results = await Promise.allSettled([
      provider.process(left, adapter.sign(left), adminId, "race-conflict"),
      provider.process(right, adapter.sign(right), adminId, "race-conflict"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      reason: { code: "IDEMPOTENCY_CONFLICT" },
    });
    expect(
      await db.providerEvent.count({ where: { eventId: base.eventId } }),
    ).toBe(1);
  });

  it("rolls back provider event, settlement ledger, wager and session atomically", async () => {
    const adapter = new DemoProviderAdapter();
    const session = await games.createSession(
      userId,
      "integration-dice",
      "rollback",
    );
    const wager = await games.wager(
      userId,
      session.id,
      "100",
      randomUUID(),
      "rollback",
    );
    const commit = {
      eventId: `commit-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.COMMIT,
    };
    await provider.process(commit, adapter.sign(commit), adminId, "rollback");
    await db.$executeRawUnsafe(
      `CREATE FUNCTION reject_round2_session_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'round2 rollback'; END $$`,
    );
    await db.$executeRawUnsafe(
      `CREATE TRIGGER reject_round2_session_update BEFORE UPDATE ON "GameSession" FOR EACH ROW EXECUTE FUNCTION reject_round2_session_update()`,
    );
    const settle = {
      eventId: `settle-${randomUUID()}`,
      providerSessionId: session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type: ProviderEventType.SETTLE,
      scenario: SettlementResult.LOSS,
    };
    try {
      await expect(
        provider.process(settle, adapter.sign(settle), adminId, "rollback"),
      ).rejects.toBeDefined();
    } finally {
      await db.$executeRawUnsafe(
        `DROP TRIGGER reject_round2_session_update ON "GameSession"`,
      );
      await db.$executeRawUnsafe(
        `DROP FUNCTION reject_round2_session_update()`,
      );
    }
    expect(
      await db.providerEvent.count({ where: { eventId: settle.eventId } }),
    ).toBe(0);
    expect(
      await db.gameWager.findUniqueOrThrow({ where: { id: wager.id } }),
    ).toMatchObject({
      status: "ACCEPTED",
      settlementLedgerTransactionId: null,
    });
    expect(
      await db.gameSession.findUniqueOrThrow({ where: { id: session.id } }),
    ).toMatchObject({ status: "ACTIVE" });
  });

  it("replays an executed grant after expiry and binds idempotency to its preview", async () => {
    const first = await admin.previewGrant(
      userId,
      "200",
      "expiry grant",
      "R2-EXPIRY",
      adminId,
      "grant",
    );
    const granted = await admin.confirmGrant(
      first.id,
      first.payloadHash,
      "round2-grant-key",
      adminId,
      "grant",
    );
    await db.adminGrantPreview.update({
      where: { id: first.id },
      data: { expiresAt: new Date(0) },
    });
    expect(
      await admin.confirmGrant(
        first.id,
        first.payloadHash,
        "round2-grant-key",
        adminId,
        "grant",
      ),
    ).toMatchObject({ transactionId: granted.transactionId, duplicate: true });
    const changed = await admin.previewGrant(
      userId,
      "200",
      "changed reason",
      "R2-EXPIRY",
      adminId,
      "grant",
    );
    await expect(
      admin.confirmGrant(
        changed.id,
        changed.payloadHash,
        "round2-grant-key",
        adminId,
        "grant",
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("restricts generic corrections to test-fund transactions", async () => {
    const wagerTransaction = await db.ledgerTransaction.findFirstOrThrow({
      where: { type: "GAME_WAGER" },
    });
    const settlementTransaction = await db.ledgerTransaction.findFirstOrThrow({
      where: { type: "GAME_SETTLEMENT" },
    });
    const refundTransaction = await db.ledgerTransaction.findFirstOrThrow({
      where: { type: "GAME_REFUND" },
    });
    for (const transaction of [
      wagerTransaction,
      settlementTransaction,
      refundTransaction,
    ])
      await expect(
        admin.correct(
          transaction.id,
          "unsafe reversal",
          "R2-CORRECTION",
          randomUUID(),
          adminId,
          "correction",
        ),
      ).rejects.toMatchObject({ code: "TRANSACTION_NOT_CORRECTABLE" });
  });

  it("enforces cancellation terminal states and open-wager protection", async () => {
    const cancellable = await games.createSession(
      userId,
      "integration-dice",
      "cancel",
    );
    expect(
      await games.cancelSession(userId, cancellable.id, "cancel"),
    ).toMatchObject({ status: "CANCELLED" });
    await expect(
      games.cancelSession(userId, cancellable.id, "cancel"),
    ).rejects.toMatchObject({ code: "SESSION_NOT_ACTIVE" });
    const open = await games.createSession(
      userId,
      "integration-dice",
      "cancel",
    );
    await games.wager(userId, open.id, "100", randomUUID(), "cancel");
    await expect(
      games.cancelSession(userId, open.id, "cancel"),
    ).rejects.toMatchObject({ code: "SESSION_HAS_OPEN_WAGER" });
    const completed = await db.gameSession.findFirstOrThrow({
      where: { status: "COMPLETED", userId },
    });
    await expect(
      games.cancelSession(userId, completed.id, "cancel"),
    ).rejects.toMatchObject({ code: "SESSION_NOT_ACTIVE" });
  });

  it("settles an already reserved wager after freeze while blocking new mutations", async () => {
    const game = await db.game.findUniqueOrThrow({
      where: { slug: "integration-dice" },
    });
    await provider.configure(
      game.id,
      SettlementResult.REFUND,
      adminId,
      "freeze-after-reserve",
    );
    const reservedSession = await games.createSession(
      userId,
      "integration-dice",
      "freeze-after-reserve",
    );
    const emptySession = await games.createSession(
      userId,
      "integration-dice",
      "freeze-after-reserve",
    );
    const wager = await games.wager(
      userId,
      reservedSession.id,
      "100",
      randomUUID(),
      "freeze-after-reserve",
    );
    await admin.status(
      userId,
      PlayerStatus.FROZEN,
      adminId,
      "freeze-after-reserve",
    );
    await provider.simulate(wager.id, adminId, "freeze-after-reserve");
    expect(
      await db.gameWager.findUniqueOrThrow({ where: { id: wager.id } }),
    ).toMatchObject({ status: "REFUNDED" });
    await expect(
      games.wager(
        userId,
        emptySession.id,
        "100",
        randomUUID(),
        "freeze-after-reserve",
      ),
    ).rejects.toMatchObject({ code: "ACCOUNT_FROZEN" });
    await expect(
      player.faucet(userId, randomUUID(), "freeze-after-reserve"),
    ).rejects.toMatchObject({ code: "ACCOUNT_FROZEN" });
    await admin.status(
      userId,
      PlayerStatus.ACTIVE,
      adminId,
      "freeze-after-reserve",
    );
  });

  it("preserves one compensation and one semantic audit under correction concurrency", async () => {
    const preview = await admin.previewGrant(
      userId,
      "300",
      "concurrent correction",
      "R2-CORR",
      adminId,
      "correction-race",
    );
    const grant = await admin.confirmGrant(
      preview.id,
      preview.payloadHash,
      randomUUID(),
      adminId,
      "correction-race",
    );
    const key = randomUUID();
    const results = await Promise.all([
      admin.correct(
        grant.transactionId,
        "concurrent correction",
        "R2-CORR-2",
        key,
        adminId,
        "correction-race",
      ),
      admin.correct(
        grant.transactionId,
        "concurrent correction",
        "R2-CORR-2",
        key,
        adminId,
        "correction-race",
      ),
    ]);
    expect(new Set(results.map((result) => result.transactionId)).size).toBe(1);
    expect(
      await db.ledgerTransaction.count({
        where: { compensatesId: grant.transactionId },
      }),
    ).toBe(1);
    expect(
      await db.auditEvent.count({
        where: {
          subjectId: grant.transactionId,
          action: "TEST_FUNDS_CORRECTION",
        },
      }),
    ).toBe(1);
  });

  it("cannot concurrently remove the final ADMIN role", async () => {
    const adminRole = await db.role.findUniqueOrThrow({
      where: { name: RoleName.ADMIN },
    });
    const second = await db.user.create({
      data: {
        email: `second-admin-${randomUUID()}@example.invalid`,
        passwordHash: "test",
      },
    });
    await db.userRole.createMany({
      data: [
        { userId: adminId, roleId: adminRole.id },
        { userId: second.id, roleId: adminRole.id },
      ],
    });
    const outcomes = await Promise.allSettled([
      admin.setRole(adminId, RoleName.ADMIN, false, adminId, "role-race"),
      admin.setRole(second.id, RoleName.ADMIN, false, second.id, "role-race"),
    ]);
    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.find((outcome) => outcome.status === "rejected"),
    ).toMatchObject({ reason: { code: "LAST_ADMIN" } });
    expect(await db.userRole.count({ where: { roleId: adminRole.id } })).toBe(
      1,
    );
  });

  it("serializes concurrent grant confirmation and daily aggregate limits", async () => {
    const target = await db.user.create({
      data: {
        email: `grant-target-${randomUUID()}@example.invalid`,
        passwordHash: "test",
        profile: { create: {} },
        accounts: {
          create: { assetCode: "TSC", kind: AccountKind.PLAYER_AVAILABLE },
        },
      },
    });
    const preview = await admin.previewGrant(
      target.id,
      "100",
      "same preview race",
      "R2-GRANT",
      adminId,
      "grant-race",
    );
    const sameKey = randomUUID();
    const confirmations = await Promise.all([
      admin.confirmGrant(
        preview.id,
        preview.payloadHash,
        sameKey,
        adminId,
        "grant-race",
      ),
      admin.confirmGrant(
        preview.id,
        preview.payloadHash,
        sameKey,
        adminId,
        "grant-race",
      ),
    ]);
    expect(
      new Set(confirmations.map((result) => result.transactionId)).size,
    ).toBe(1);
    expect(
      await db.auditEvent.count({
        where: { subjectId: target.id, action: "TEST_FUNDS_GRANT" },
      }),
    ).toBe(1);

    const previous = process.env.DEMO_GRANT_DAILY_LIMIT;
    process.env.DEMO_GRANT_DAILY_LIMIT = "500";
    try {
      const [left, right] = await Promise.all([
        admin.previewGrant(
          target.id,
          "300",
          "daily race left",
          "R2-LEFT",
          adminId,
          "grant-race",
        ),
        admin.previewGrant(
          target.id,
          "300",
          "daily race right",
          "R2-RIGHT",
          adminId,
          "grant-race",
        ),
      ]);
      const outcomes = await Promise.allSettled([
        admin.confirmGrant(
          left.id,
          left.payloadHash,
          randomUUID(),
          adminId,
          "grant-race",
        ),
        admin.confirmGrant(
          right.id,
          right.payloadHash,
          randomUUID(),
          adminId,
          "grant-race",
        ),
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        outcomes.find((outcome) => outcome.status === "rejected"),
      ).toMatchObject({ reason: { code: "GRANT_DAILY_LIMIT" } });
    } finally {
      if (previous === undefined) delete process.env.DEMO_GRANT_DAILY_LIMIT;
      else process.env.DEMO_GRANT_DAILY_LIMIT = previous;
    }
  });
});
