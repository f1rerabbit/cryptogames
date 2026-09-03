import { randomUUID } from "node:crypto";
import { AccountKind, PlayerStatus, RoleName } from "@cg/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AdminService } from "../admin/admin.service.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { PlayerService } from "../player/player.service.js";
import { GamesService } from "./games.service.js";
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("MASTER-02 PostgreSQL vertical slice", () => {
  let db: DatabaseService,
    ledger: LedgerService,
    player: PlayerService,
    games: GamesService,
    admin: AdminService,
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
  it("performs audited idempotent admin credit/debit and rejects insufficient balance", async () => {
    const credit = await admin.adjust(
      userId,
      "credit",
      "500",
      "Integration grant",
      "TICKET-1",
      "admin-credit-0001",
      adminId,
      "integration",
    );
    expect(credit.amount).toBe("500");
    const duplicate = await admin.adjust(
      userId,
      "credit",
      "500",
      "Integration grant",
      "TICKET-1",
      "admin-credit-0001",
      adminId,
      "integration",
    );
    expect(duplicate.transactionId).toBe(credit.transactionId);
    await admin.adjust(
      userId,
      "debit",
      "50",
      "Integration correction",
      "TICKET-2",
      "admin-debit-0001",
      adminId,
      "integration",
    );
    await expect(
      admin.adjust(
        userId,
        "debit",
        "999999",
        "Too much",
        "TICKET-3",
        "admin-debit-0002",
        adminId,
        "integration",
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
    expect(
      await db.auditEvent.count({
        where: { action: { startsWith: "ADMIN_TEST_" } },
      }),
    ).toBeGreaterThanOrEqual(3);
  });
});
