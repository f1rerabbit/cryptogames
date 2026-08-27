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
  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app, ["http://localhost:3000", "http://localhost:3002"]);
    await app.init();
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
    await request(app.getHttpServer())
      .post("/v1/auth/register")
      .send(credentials)
      .expect(201);
    await request(app.getHttpServer())
      .post("/v1/auth/register")
      .set("x-correlation-id", "duplicate-registration")
      .send(credentials)
      .expect(409);
    const stored = await db.user.findUniqueOrThrow({
      where: { email: credentials.email },
    });
    expect(stored.passwordHash).not.toBe(credentials.password);

    const login = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send(credentials)
      .expect(200);
    const token = (login.body as { token: string }).token;
    expect(token).toHaveLength(43);
    const session = await db.session.findFirstOrThrow({
      where: { userId: stored.id },
    });
    expect(session.tokenHash).not.toBe(token);

    const me = await request(app.getHttpServer())
      .get("/v1/me")
      .set("authorization", `Bearer ${token}`)
      .expect(200);
    expect(me.body as unknown).toMatchObject({
      id: stored.id,
      email: credentials.email,
      roles: ["PLAYER"],
    });
    await request(app.getHttpServer())
      .post("/v1/auth/logout")
      .set("authorization", `Bearer ${token}`)
      .expect(204);
    await request(app.getHttpServer())
      .get("/v1/me")
      .set("authorization", `Bearer ${token}`)
      .expect(401);

    const secondLogin = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send(credentials)
      .expect(200);
    const secondToken = (secondLogin.body as { token: string }).token;
    const sessions = await request(app.getHttpServer())
      .get("/v1/me/security/sessions")
      .set("authorization", `Bearer ${secondToken}`)
      .expect(200);
    const current = (
      sessions.body as Array<{ id: string; revokedAt: string | null }>
    ).find((item) => item.revokedAt === null);
    expect(current).toBeDefined();
    await request(app.getHttpServer())
      .post(`/v1/me/security/sessions/${current!.id}/revoke`)
      .set("authorization", `Bearer ${secondToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .get("/v1/me")
      .set("authorization", `Bearer ${secondToken}`)
      .expect(401);
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
    const unauthorized = await request(app.getHttpServer())
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
    await request(app.getHttpServer())
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
