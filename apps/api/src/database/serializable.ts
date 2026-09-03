import { Prisma } from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "./database.service.js";
export async function runSerializableWithRetry<T>(
  db: DatabaseService,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 3,
  retryUnique = true,
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || (retryUnique && error.code === "P2002"));
      if (!retryable) throw error;
      if (attempt + 1 === attempts)
        throw new ApplicationError(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Concurrent operation could not be completed",
          503,
        );
      await new Promise((resolve) => setTimeout(resolve, 5 * (attempt + 1)));
    }
  }
  throw new ApplicationError(
    "SERIALIZATION_RETRY_EXHAUSTED",
    "Concurrent operation could not be completed",
    503,
  );
}
