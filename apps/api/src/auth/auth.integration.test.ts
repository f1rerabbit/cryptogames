import type { Server } from "node:http";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { RoleName } from "@cg/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { DatabaseService } from "../database/database.service.js";
import { configureApp } from "../configure-app.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)("persistent authentication HTTP workflow", () => {
  let app: INestApplication;
  let db: DatabaseService;
  let server: Server;
  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app, ["http://localhost:3000", "http://localhost:3002"]);
    await app.init();
    server = app.getHttpServer() as Server;
    db = app.get(DatabaseService);
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "AuditEvent", "Session", "UserRole", "User", "Role" CASCADE',
    );
    await db.role.createMany({
      data: Object.values(RoleName).map((name) => ({ name })),
    });
  });
  afterAll(async () => app.close());

  it("registers, logs in, returns the current user, and revokes the opaque session", async () => {
    const credentials = {
      email: "player@example.invalid",
      password: "correct horse demo",
    };
    await request(server)
      .post("/v1/auth/register")
      .send(credentials)
      .expect(201);
    await request(server)
      .post("/v1/auth/register")
      .set("x-correlation-id", "duplicate-registration")
      .send(credentials)
      .expect(409);
    const stored = await db.user.findUniqueOrThrow({
      where: { email: credentials.email },
    });
    expect(stored.passwordHash).not.toBe(credentials.password);

    const browser = request.agent(server);
    const login = await browser
      .post("/v1/auth/login")
      .send(credentials)
      .expect(200);
    expect(login.body).not.toHaveProperty("token");
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(login.headers["set-cookie"]?.[0]).toContain("SameSite=Lax");
    const session = await db.session.findFirstOrThrow({
      where: { userId: stored.id },
    });
    expect(session.tokenHash).toHaveLength(64);
    const me = await browser.get("/v1/me").expect(200);
    expect(me.body as unknown).toMatchObject({
      id: stored.id,
      email: credentials.email,
      roles: ["PLAYER"],
    });
    await browser.post("/v1/auth/logout").expect(204);
    await browser.get("/v1/me").expect(401);
    const secondBrowser = request.agent(server);
    await secondBrowser.post("/v1/auth/login").send(credentials).expect(200);
    const sessions = await secondBrowser
      .get("/v1/me/security/sessions")
      .expect(200);
    const current = (
      sessions.body as Array<{ id: string; revokedAt: string | null }>
    ).find((item) => item.revokedAt === null);
    expect(current).toBeDefined();
    await secondBrowser
      .post(`/v1/me/security/sessions/${current!.id}/revoke`)
      .expect(201);
    await secondBrowser.get("/v1/me").expect(401);
    expect(
      await db.auditEvent.count({ where: { actorId: stored.id } }),
    ).toBeGreaterThanOrEqual(3);
    expect(
      await db.auditEvent.count({
        where: {
          actorId: stored.id,
          action: "AUTH_REGISTER",
          outcome: "DENIED",
        },
      }),
    ).toBe(1);
  });

  it("returns correlated safe errors for unauthorized access and invalid login", async () => {
    const unauthorized = await request(server)
      .get("/v1/me")
      .set("x-correlation-id", "critic-unauthorized")
      .expect(401);
    expect(unauthorized.body as unknown).toEqual({
      error: {
        code: "REQUEST_REJECTED",
        message: "Authentication required",
        correlationId: "critic-unauthorized",
      },
    });
    await request(server)
      .post("/v1/auth/login")
      .send({
        email: "player@example.invalid",
        password: "wrong-password-value",
      })
      .expect(401);
    expect(
      await db.auditEvent.count({
        where: { action: "AUTH_LOGIN", outcome: "DENIED" },
      }),
    ).toBe(1);
  });
});
