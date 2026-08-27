import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../prisma/seed.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)("development seed", () => {
  let db: PrismaClient;
  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    db = new PrismaClient();
    await db.$connect();
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "Session", "UserRole", "User", "Role" CASCADE',
    );
  });
  afterAll(async () => db.$disconnect());

  it("is repeatable and rotates demo password hashes", async () => {
    const base = {
      NODE_ENV: "test",
      DEMO_ADMIN_EMAIL: "admin@example.invalid",
      DEMO_PLAYER_EMAIL: "player@example.invalid",
    };
    await seedDatabase(db, {
      ...base,
      DEMO_ACCOUNT_PASSWORD: "first-demo-password",
    });
    await seedDatabase(db, {
      ...base,
      DEMO_ACCOUNT_PASSWORD: "second-demo-password",
    });
    const player = await db.user.findUniqueOrThrow({
      where: { email: base.DEMO_PLAYER_EMAIL },
    });
    await expect(
      argon2.verify(player.passwordHash, "second-demo-password"),
    ).resolves.toBe(true);
    await expect(
      argon2.verify(player.passwordHash, "first-demo-password"),
    ).resolves.toBe(false);
  });
});
