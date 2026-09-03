import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prisma and PostgreSQL UUID contract", () => {
  const schema = readFileSync(
    new URL("../prisma/schema.prisma", import.meta.url),
    "utf8",
  );
  const migration = readFileSync(
    new URL(
      "../prisma/migrations/20260827000000_foundation/migration.sql",
      import.meta.url,
    ),
    "utf8",
  );
  it("uses native UUID types for persisted identifiers", () => {
    for (const field of [
      "id",
      "userId",
      "roleId",
      "transactionId",
      "accountId",
      "compensatesId",
    ])
      expect(schema).toMatch(
        new RegExp(`${field}\\s+String\\??[^\\n]*@db\\.Uuid`),
      );
    expect(migration).toContain('"compensatesId" UUID');
    expect(migration).toContain('"actorId" UUID');
  });
  it("enforces the compensation foreign key", () => {
    expect(migration).toContain('"LedgerTransaction_compensatesId_fkey"');
  });
});
