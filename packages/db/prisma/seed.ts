import { pathToFileURL } from "node:url";
import argon2 from "argon2";
import {
  AccountKind,
  PrismaClient,
  RoleName,
  SettlementResult,
} from "@prisma/client";
import { assertSeedAllowed } from "../src/seed-policy.js";

type SeedEnvironment = NodeJS.ProcessEnv;
export async function seedDatabase(db: PrismaClient, env: SeedEnvironment) {
  assertSeedAllowed(env.NODE_ENV);
  const password = env.DEMO_ACCOUNT_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "DEMO_ACCOUNT_PASSWORD must contain at least 12 characters",
    );
  await db.asset.upsert({
    where: { code: "TSC" },
    update: { name: "Test Satoshi Credit", scale: 0, withdrawable: false },
    create: {
      code: "TSC",
      name: "Test Satoshi Credit",
      scale: 0,
      withdrawable: false,
    },
  });
  for (const kind of [
    AccountKind.PLATFORM_TREASURY,
    AccountKind.GAME_ESCROW,
    AccountKind.TEST_FAUCET,
  ]) {
    const existing = await db.ledgerAccount.findFirst({
      where: { userId: null, assetCode: "TSC", kind },
    });
    if (!existing)
      await db.ledgerAccount.create({
        data: {
          assetCode: "TSC",
          kind,
          allowNegative: kind !== AccountKind.GAME_ESCROW,
        },
      });
  }
  for (const name of Object.values(RoleName))
    await db.role.upsert({ where: { name }, update: {}, create: { name } });
  let adminId = "";
  for (const [emailKey, role] of [
    ["DEMO_ADMIN_EMAIL", RoleName.ADMIN],
    ["DEMO_PLAYER_EMAIL", RoleName.PLAYER],
  ] as const) {
    const email = env[emailKey];
    if (!email) throw new Error(`${emailKey} is required`);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await db.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    if (role === RoleName.ADMIN) adminId = user.id;
    const roleRow = await db.role.findUniqueOrThrow({ where: { name: role } });
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
      update: {},
      create: { userId: user.id, roleId: roleRow.id },
    });
    if (role === RoleName.PLAYER) {
      await db.playerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, displayName: "Demo Player" },
      });
      await db.ledgerAccount.upsert({
        where: {
          userId_assetCode_kind: {
            userId: user.id,
            assetCode: "TSC",
            kind: AccountKind.PLAYER_AVAILABLE,
          },
        },
        update: {},
        create: {
          userId: user.id,
          assetCode: "TSC",
          kind: AccountKind.PLAYER_AVAILABLE,
        },
      });
    }
  }
  for (const game of [
    ["emerald-dice", "Emerald Dice", "Table", 100n, 10_000n, 10],
    ["coin-flip", "Coin Flip", "Instant", 100n, 5_000n, 20],
    ["aurora-crash", "Aurora Crash Demo", "Arcade", 250n, 20_000n, 30],
    ["midnight-mines", "Midnight Mines Demo", "Puzzle", 100n, 10_000n, 40],
    ["temple-reels", "Temple Reels Demo", "Reels", 50n, 5_000n, 50],
  ] as const) {
    const seededGame = await db.game.upsert({
      where: { slug: game[0] },
      update: {
        name: game[1],
        provider: "CG Deterministic Simulator",
        category: game[2],
        description: "Server-authoritative deterministic demo lifecycle.",
        active: true,
        demoOnly: true,
        minBet: game[3],
        maxBet: game[4],
        sortOrder: game[5],
      },
      create: {
        slug: game[0],
        name: game[1],
        provider: "CG Deterministic Simulator",
        category: game[2],
        description: "Server-authoritative deterministic demo lifecycle.",
        minBet: game[3],
        maxBet: game[4],
        sortOrder: game[5],
      },
    });
    await db.providerScenarioFixture.upsert({
      where: { gameId: seededGame.id },
      update: { scenario: SettlementResult.LOSS, updatedBy: adminId },
      create: {
        gameId: seededGame.id,
        scenario: SettlementResult.LOSS,
        updatedBy: adminId,
      },
    });
  }
}

async function main() {
  const db = new PrismaClient();
  try {
    await seedDatabase(db, process.env);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  void main();
