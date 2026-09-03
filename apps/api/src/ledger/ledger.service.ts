import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { EntryDirection, Prisma } from "@cg/db";
import { DatabaseService } from "../database/database.service.js";

export type LedgerEntryCommand = {
  accountId: string;
  direction: EntryDirection;
  amount: bigint;
};
export type LedgerCommand = {
  scope: string;
  idempotencyKey: string;
  type: string;
  entries: LedgerEntryCommand[];
  correlationId: string;
  actorId?: string;
  referenceId?: string;
  compensatesId?: string;
};
export class LedgerError extends Error {}

@Injectable()
export class LedgerService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async post(command: LedgerCommand) {
    this.validate(command);
    const requestHash = this.hash(command);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.$transaction(
          async (tx) => this.executeWithin(tx, command, requestHash),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (error instanceof LedgerError) throw error;
        if (this.isRetryable(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new LedgerError("Ledger transaction retry limit exceeded");
  }

  async postWithin(tx: Prisma.TransactionClient, command: LedgerCommand) {
    this.validate(command);
    return this.executeWithin(tx, command, this.hash(command));
  }

  private async executeWithin(
    tx: Prisma.TransactionClient,
    command: LedgerCommand,
    requestHash: string,
  ) {
    const existing = await tx.idempotencyRecord.findUnique({
      where: {
        scope_key: {
          scope: command.scope,
          key: command.idempotencyKey,
        },
      },
      include: { transaction: { include: { entries: true } } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash)
        throw new LedgerError("Idempotency key reused with different request");
      return existing.transaction;
    }

    const accountIds = [
      ...new Set(command.entries.map((entry) => entry.accountId)),
    ].sort();
    const accounts = [];
    for (const accountId of accountIds) {
      const rows = await tx.$queryRaw<
        Array<{ id: string; allowNegative: boolean; assetCode: string }>
      >`SELECT "id", "allowNegative", "assetCode" FROM "LedgerAccount" WHERE "id" = ${accountId}::uuid FOR UPDATE`;
      const account = rows[0];
      if (!account) throw new LedgerError("Unknown ledger account");
      if (account.assetCode !== "TSC")
        throw new LedgerError("Only TSC is supported");
      accounts.push(account);
    }

    for (const account of accounts) {
      if (account.allowNegative) continue;
      const totals = await tx.ledgerEntry.groupBy({
        by: ["direction"],
        where: { accountId: account.id },
        _sum: { amount: true },
      });
      const current = totals.reduce(
        (balance, row) =>
          balance +
          (row.direction === EntryDirection.CREDIT
            ? (row._sum.amount ?? 0n)
            : -(row._sum.amount ?? 0n)),
        0n,
      );
      const delta = command.entries
        .filter((entry) => entry.accountId === account.id)
        .reduce(
          (balance, entry) =>
            balance +
            (entry.direction === EntryDirection.CREDIT
              ? entry.amount
              : -entry.amount),
          0n,
        );
      if (current + delta < 0n)
        throw new LedgerError("Insufficient available balance");
    }

    const transaction = await tx.ledgerTransaction.create({
      data: {
        assetCode: "TSC",
        type: command.type,
        correlationId: command.correlationId,
        ...(command.referenceId ? { referenceId: command.referenceId } : {}),
        ...(command.compensatesId
          ? { compensatesId: command.compensatesId }
          : {}),
        entries: { create: command.entries },
      },
      include: { entries: true },
    });
    await tx.idempotencyRecord.create({
      data: {
        scope: command.scope,
        key: command.idempotencyKey,
        requestHash,
        transactionId: transaction.id,
      },
    });
    await tx.auditEvent.create({
      data: {
        ...(command.actorId ? { actorId: command.actorId } : {}),
        subjectId: transaction.id,
        action: "LEDGER_POST",
        outcome: "SUCCESS",
        correlationId: command.correlationId,
        metadata: {
          type: command.type,
          idempotencyScope: command.scope,
        },
      },
    });
    return transaction;
  }

  async compensate(
    transactionId: string,
    idempotencyKey: string,
    correlationId: string,
    actorId?: string,
  ) {
    const original = await this.db.ledgerTransaction.findUnique({
      where: { id: transactionId },
      include: { entries: true },
    });
    if (!original) throw new LedgerError("Original transaction not found");
    return this.post({
      scope: "compensation",
      idempotencyKey,
      type: `COMPENSATE_${original.type}`,
      correlationId,
      ...(actorId ? { actorId } : {}),
      compensatesId: original.id,
      entries: original.entries.map((entry) => ({
        accountId: entry.accountId,
        amount: entry.amount,
        direction:
          entry.direction === EntryDirection.DEBIT
            ? EntryDirection.CREDIT
            : EntryDirection.DEBIT,
      })),
    });
  }

  private validate(command: LedgerCommand) {
    if (!command.idempotencyKey)
      throw new LedgerError("Idempotency key required");
    if (
      command.entries.length < 2 ||
      command.entries.some((entry) => entry.amount <= 0n)
    )
      throw new LedgerError("Positive entries required");
    const debit = command.entries
      .filter((entry) => entry.direction === EntryDirection.DEBIT)
      .reduce((sum, entry) => sum + entry.amount, 0n);
    const credit = command.entries
      .filter((entry) => entry.direction === EntryDirection.CREDIT)
      .reduce((sum, entry) => sum + entry.amount, 0n);
    if (debit !== credit) throw new LedgerError("Transaction is not balanced");
  }

  private hash(command: LedgerCommand) {
    return createHash("sha256")
      .update(
        JSON.stringify(
          {
            type: command.type,
            referenceId: command.referenceId ?? null,
            compensatesId: command.compensatesId ?? null,
            entries: command.entries,
          },
          (_key: string, value: unknown): unknown =>
            typeof value === "bigint" ? value.toString() : value,
        ),
      )
      .digest("hex");
  }

  private isRetryable(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    );
  }
}
