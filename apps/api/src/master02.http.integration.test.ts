/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import type { Server } from "node:http";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AccountKind, RoleName, SettlementResult } from "@cg/db";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configure-app.js";
import { DatabaseService } from "./database/database.service.js";
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("MASTER-02 HTTP contracts", () => {
  let app: INestApplication,
    db: DatabaseService,
    server: Server,
    player: ReturnType<typeof request.agent>,
    other: ReturnType<typeof request.agent>,
    admin: ReturnType<typeof request.agent>,
    playerId: string,
    otherId: string,
    gameId: string;
  const password = "http-demo-password";
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.APP_MODE = "test";
    process.env.SESSION_SECRET = "http-session-secret-at-least-32-characters";
    process.env.PROVIDER_CALLBACK_SECRET =
      "http-provider-secret-at-least-32-chars";
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app, ["http://localhost:3000", "http://localhost:3002"]);
    await app.init();
    server = app.getHttpServer() as Server;
    db = app.get(DatabaseService);
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "ProviderEvent", "ProviderScenarioFixture", "AdminGrantPreview", "AuditEvent", "IdempotencyRecord", "LedgerEntry", "GameWager", "GameSession", "DemoFaucetClaim", "Game", "LedgerTransaction", "LedgerAccount", "PlayerProfile", "Session", "UserRole", "User", "Role", "Asset" CASCADE',
    );
    await db.asset.create({
      data: { code: "TSC", name: "Test Satoshi Credit" },
    });
    for (const name of Object.values(RoleName))
      await db.role.create({ data: { name } });
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
    const hash = await argon2.hash(password);
    async function user(email: string, role: RoleName, profile: boolean) {
      const roleRow = await db.role.findUniqueOrThrow({
        where: { name: role },
      });
      return db.user.create({
        data: {
          email,
          passwordHash: hash,
          roles: { create: { roleId: roleRow.id } },
          ...(profile
            ? {
                profile: { create: {} },
                accounts: {
                  create: {
                    assetCode: "TSC",
                    kind: AccountKind.PLAYER_AVAILABLE,
                  },
                },
              }
            : {}),
        },
      });
    }
    const p = await user("http-player@example.invalid", RoleName.PLAYER, true),
      o = await user("http-other@example.invalid", RoleName.PLAYER, true);
    await user("http-admin@example.invalid", RoleName.ADMIN, false);
    playerId = p.id;
    otherId = o.id;
    const game = await db.game.create({
      data: {
        slug: "http-game",
        name: "HTTP Game",
        provider: "CG Demo",
        category: "TEST",
        minBet: 100n,
        maxBet: 1000n,
      },
    });
    gameId = game.id;
    player = request.agent(server);
    other = request.agent(server);
    admin = request.agent(server);
    for (const [a, email] of [
      [player, "http-player@example.invalid"],
      [other, "http-other@example.invalid"],
      [admin, "http-admin@example.invalid"],
    ] as const)
      await a.post("/v1/auth/login").send({ email, password }).expect(200);
  });
  afterAll(async () => app.close());
  it("denies unauthenticated and player admin access with correlation IDs", async () => {
    const denied = await request(server)
      .get("/v1/me/wallet")
      .set("x-correlation-id", "http-unauthorized")
      .expect(401);
    expect(denied.body.error.correlationId).toBe("http-unauthorized");
    await player.get("/v1/admin/players").expect(403);
  });
  it("isolates ownership and returns stable frozen/bet errors", async () => {
    await admin
      .post(`/v1/admin/players/${playerId}/freeze`)
      .send({})
      .expect(201);
    const frozen = await player
      .post("/v1/me/wallet/faucet")
      .send({ idempotencyKey: "http-faucet-0001" })
      .expect(403);
    expect(frozen.body.error.code).toBe("ACCOUNT_FROZEN");
    await admin
      .post(`/v1/admin/players/${playerId}/unfreeze`)
      .send({})
      .expect(201);
    await player
      .post("/v1/me/wallet/faucet")
      .send({ idempotencyKey: "http-faucet-0002" })
      .expect(201);
    const cooldown = await player
      .post("/v1/me/wallet/faucet")
      .send({ idempotencyKey: "http-faucet-0003" })
      .expect(429);
    expect(cooldown.body.error.code).toBe("FAUCET_COOLDOWN");
    const session = await player
      .post("/v1/games/http-game/sessions")
      .send({})
      .expect(201);
    await other.get(`/v1/me/game-sessions/${session.body.id}`).expect(404);
    const zero = await player
      .post(`/v1/game-sessions/${session.body.id}/wagers`)
      .send({ stake: "0", idempotencyKey: "http-wager-zero" })
      .expect(400);
    expect(zero.body.error.correlationId).toBeTruthy();
    const wager = await player
      .post(`/v1/game-sessions/${session.body.id}/wagers`)
      .send({ stake: "100", idempotencyKey: "http-wager-0001" })
      .expect(201);
    expect(wager.body.stake).toBe("100");
    const conflict = await player
      .post(`/v1/game-sessions/${session.body.id}/wagers`)
      .send({ stake: "101", idempotencyKey: "http-wager-0001" })
      .expect(409);
    expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });
  it("previews/confirms one audited grant and reflects game patch in player catalog", async () => {
    const preview = await admin
      .post(`/v1/admin/players/${otherId}/grants/preview`)
      .send({
        amount: "500",
        reason: "HTTP demo grant",
        ticket: "HTTP-1",
        idempotencyKey: "preview-http",
      })
      .expect(201);
    expect(preview.body.entries).toHaveLength(2);
    await admin
      .post(`/v1/admin/grants/${preview.body.id}/confirm`)
      .send({
        previewHash: preview.body.payloadHash,
        idempotencyKey: "confirm-http",
      })
      .expect(201);
    await admin
      .post(`/v1/admin/grants/${preview.body.id}/confirm`)
      .send({
        previewHash: preview.body.payloadHash,
        idempotencyKey: "confirm-http",
      })
      .expect(201);
    expect(
      await db.auditEvent.count({ where: { action: "TEST_FUNDS_GRANT" } }),
    ).toBe(1);
    await admin
      .patch(`/v1/admin/games/${gameId}`)
      .send({ active: false, minBet: "200", maxBet: "2000", sortOrder: 99 })
      .expect(200);
    const catalog = await player.get("/v1/games").expect(200);
    expect(catalog.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: gameId })]),
    );
    await admin
      .post(`/v1/admin/games/${gameId}/scenario`)
      .send({ scenario: SettlementResult.LOSS })
      .expect(201);
  });
  it("fails simulator and faucet closed in production", async () => {
    process.env.APP_MODE = "production";
    await player
      .post("/v1/me/wallet/faucet")
      .send({ idempotencyKey: "prod-faucet" })
      .expect(404);
    await admin
      .post(`/v1/admin/games/${gameId}/scenario`)
      .send({ scenario: SettlementResult.LOSS })
      .expect(404);
    process.env.APP_MODE = "test";
  });
});
