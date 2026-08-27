import argon2 from "argon2";
import { PrismaClient, RoleName } from "@prisma/client";
import { assertSeedAllowed } from "../src/seed-policy.js";
const db = new PrismaClient();
async function main() {
  assertSeedAllowed(process.env.NODE_ENV);
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "DEMO_ACCOUNT_PASSWORD must contain at least 12 characters",
    );
  await db.asset.upsert({
    where: { code: "TSC" },
    update: {},
    create: {
      code: "TSC",
      name: "Test Satoshi Credit",
      scale: 0,
      withdrawable: false,
    },
  });
  for (const name of Object.values(RoleName))
    await db.role.upsert({ where: { name }, update: {}, create: { name } });
  for (const [emailKey, role] of [
    ["DEMO_ADMIN_EMAIL", RoleName.ADMIN],
    ["DEMO_PLAYER_EMAIL", RoleName.PLAYER],
  ] as const) {
    const email = process.env[emailKey];
    if (!email) throw new Error(`${emailKey} is required`);
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      },
    });
    const roleRow = await db.role.findUniqueOrThrow({ where: { name: role } });
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
      update: {},
      create: { userId: user.id, roleId: roleRow.id },
    });
  }
}
main().finally(() => db.$disconnect());
