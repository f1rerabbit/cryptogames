import { Inject, Injectable } from "@nestjs/common";
import { AccountKind, EntryDirection, PlayerStatus, Prisma } from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { runSerializableWithRetry } from "../database/serializable.js";

const FAUCET_AMOUNT = BigInt(process.env.DEMO_FAUCET_AMOUNT ?? "100000");
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
@Injectable()
export class PlayerService {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(LedgerService) private ledger: LedgerService,
  ) {}

  profile(userId: string) {
    return this.db.playerProfile.findUniqueOrThrow({ where: { userId } });
  }
  updateProfile(userId: string, displayName?: string) {
    return this.db.playerProfile.update({
      where: { userId },
      data: { ...(displayName === undefined ? {} : { displayName }) },
    });
  }
  private async account(
    userId: string,
    tx: Prisma.TransactionClient | DatabaseService = this.db,
  ) {
    return tx.ledgerAccount.findUniqueOrThrow({
      where: {
        userId_assetCode_kind: {
          userId,
          assetCode: "TSC",
          kind: AccountKind.PLAYER_AVAILABLE,
        },
      },
    });
  }
  async wallet(userId: string) {
    const account = await this.account(userId);
    const rows = await this.db.ledgerEntry.groupBy({
      by: ["direction"],
      where: { accountId: account.id },
      _sum: { amount: true },
    });
    const available = rows.reduce(
      (sum, row) =>
        sum +
        (row.direction === EntryDirection.CREDIT
          ? (row._sum.amount ?? 0n)
          : -(row._sum.amount ?? 0n)),
      0n,
    );
    return {
      asset: "TSC",
      available: available.toString(),
      displayBalance: `${available.toString()} TSC`,
      demo: true,
      withdrawable: false,
    };
  }
  async faucet(userId: string, key: string, correlationId: string) {
    if (!["demo", "test"].includes(process.env.APP_MODE ?? "demo"))
      throw new ApplicationError(
        "DEMO_FUNDS_DISABLED",
        "Demo funds are disabled",
        404,
      );
    return runSerializableWithRetry(this.db, async (tx) => {
      const profile = await tx.playerProfile.findUniqueOrThrow({
        where: { userId },
      });
      if (profile.status !== PlayerStatus.ACTIVE)
        throw new ApplicationError(
          profile.status === PlayerStatus.FROZEN
            ? "ACCOUNT_FROZEN"
            : "ACCOUNT_SUSPENDED",
          "Account cannot perform financial actions",
          403,
        );
      const duplicate = await tx.demoFaucetClaim.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
      });
      if (duplicate)
        return {
          id: duplicate.id,
          amount: duplicate.amount.toString(),
          claimedAt: duplicate.claimedAt,
          duplicate: true,
        };
      const recent = await tx.demoFaucetClaim.findFirst({
        where: {
          userId,
          claimedAt: { gt: new Date(Date.now() - COOLDOWN_MS) },
        },
        orderBy: { claimedAt: "desc" },
      });
      if (recent)
        throw new ApplicationError(
          "FAUCET_COOLDOWN",
          "Demo faucet is available once every 24 hours",
          429,
        );
      const player = await this.account(userId, tx);
      const source = await tx.ledgerAccount.findFirstOrThrow({
        where: {
          userId: null,
          assetCode: "TSC",
          kind: AccountKind.TEST_FAUCET,
        },
      });
      const transaction = await this.ledger.postWithin(tx, {
        scope: `faucet:${userId}`,
        idempotencyKey: key,
        type: "FAUCET",
        referenceId: "DEMO_FAUCET_24H",
        actorId: userId,
        correlationId,
        entries: [
          {
            accountId: source.id,
            direction: EntryDirection.DEBIT,
            amount: FAUCET_AMOUNT,
          },
          {
            accountId: player.id,
            direction: EntryDirection.CREDIT,
            amount: FAUCET_AMOUNT,
          },
        ],
      });
      const claim = await tx.demoFaucetClaim.create({
        data: { userId, idempotencyKey: key, amount: FAUCET_AMOUNT },
      });
      return {
        id: claim.id,
        transactionId: transaction.id,
        amount: claim.amount.toString(),
        claimedAt: claim.claimedAt,
        duplicate: false,
      };
    });
  }
  async transactions(userId: string, cursor?: string) {
    const account = await this.account(userId);
    const rows = await this.db.ledgerEntry.findMany({
      where: { accountId: account.id },
      include: { transaction: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, 20).map((row) => ({
      id: row.id,
      transactionId: row.transactionId,
      category: row.transaction.type,
      amount: `${row.direction === EntryDirection.CREDIT ? "" : "-"}${row.amount.toString()}`,
      asset: "TSC",
      timestamp: row.createdAt,
      reference: row.transaction.referenceId,
      demo: true,
    }));
    return {
      items,
      page: {
        nextCursor: rows.length > 20 ? (items.at(-1)?.id ?? null) : null,
        hasMore: rows.length > 20,
      },
    };
  }
}
