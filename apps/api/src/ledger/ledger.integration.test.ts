import { randomUUID } from "node:crypto";
import { AccountKind, EntryDirection } from "@cg/db";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { DatabaseService } from "../database/database.service.js";
import { LedgerError, LedgerService } from "./ledger.service.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)("PostgreSQL ledger integration", () => {
  let db: DatabaseService;
  let ledger: LedgerService;
  let player: string;
  let system: string;
  const correlationId = randomUUID();

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    db = new DatabaseService();
    await db.$connect();
    ledger = new LedgerService(db);
  });
  beforeEach(async () => {
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "AuditEvent", "IdempotencyRecord", "LedgerEntry", "LedgerTransaction", "LedgerAccount" CASCADE',
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
    const accounts = await Promise.all([
      db.ledgerAccount.create({
        data: {
          assetCode: "TSC",
          kind: AccountKind.TEST_FUNDS,
          allowNegative: false,
        },
      }),
      db.ledgerAccount.create({
        data: {
          assetCode: "TSC",
          kind: AccountKind.SYSTEM,
          allowNegative: true,
        },
      }),
    ]);
    player = accounts[0]!.id;
    system = accounts[1]!.id;
    await ledger.post({
      scope: "grant",
      idempotencyKey: randomUUID(),
      type: "TEST_OPENING",
      correlationId,
      entries: [
        { accountId: system, direction: EntryDirection.DEBIT, amount: 100n },
        { accountId: player, direction: EntryDirection.CREDIT, amount: 100n },
      ],
    });
  });
  afterAll(async () => db.$disconnect());

  const debit = (key: string, amount: bigint) =>
    ledger.post({
      scope: "bet",
      idempotencyKey: key,
      type: "DEMO_BET",
      correlationId,
      entries: [
        { accountId: player, direction: EntryDirection.DEBIT, amount },
        { accountId: system, direction: EntryDirection.CREDIT, amount },
      ],
    });

  it("persists balanced entries and deduplicates identical commands", async () => {
    const key = randomUUID();
    const first = await debit(key, 20n);
    const duplicate = await debit(key, 20n);
    expect(duplicate.id).toBe(first.id);
    expect(await db.ledgerTransaction.count()).toBe(2);
  });

  it("preserves the zero-sum invariant across varied integer amounts", async () => {
    for (let amount = 1n; amount <= 10n; amount += 1n)
      await debit(randomUUID(), amount);
    const entries = await db.ledgerEntry.findMany({
      select: { direction: true, amount: true },
    });
    const total = entries.reduce(
      (sum, entry) =>
        sum +
        (entry.direction === EntryDirection.CREDIT
          ? entry.amount
          : -entry.amount),
      0n,
    );
    expect(total).toBe(0n);
  });

  it("rejects idempotency collisions", async () => {
    const key = randomUUID();
    await debit(key, 10n);
    await expect(debit(key, 11n)).rejects.toThrow(
      "Idempotency key reused with different request",
    );
  });

  it("serializes concurrent debits and prevents a negative balance", async () => {
    const results = await Promise.allSettled([
      debit(randomUUID(), 80n),
      debit(randomUUID(), 80n),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
  });

  it("rejects unbalanced transactions before persistence", async () => {
    await expect(
      ledger.post({
        scope: "bet",
        idempotencyKey: randomUUID(),
        type: "BAD",
        correlationId,
        entries: [
          { accountId: player, direction: EntryDirection.DEBIT, amount: 2n },
          { accountId: system, direction: EntryDirection.CREDIT, amount: 1n },
        ],
      }),
    ).rejects.toBeInstanceOf(LedgerError);
  });

  it("appends compensation and preserves original history", async () => {
    const original = await debit(randomUUID(), 20n);
    const compensation = await ledger.compensate(
      original.id,
      randomUUID(),
      correlationId,
    );
    expect(compensation.compensatesId).toBe(original.id);
    expect(await db.ledgerTransaction.count()).toBe(3);
    expect(await db.ledgerEntry.count()).toBe(6);
  });

  it("enforces append-only ledger and audit history in PostgreSQL", async () => {
    const transaction = await debit(randomUUID(), 5n);
    await expect(
      db.ledgerTransaction.delete({ where: { id: transaction.id } }),
    ).rejects.toThrow();
    const audit = await db.auditEvent.findFirstOrThrow({
      where: { subjectId: transaction.id },
    });
    await expect(
      db.auditEvent.update({
        where: { id: audit.id },
        data: { outcome: "ALTERED" },
      }),
    ).rejects.toThrow();
  });
});
