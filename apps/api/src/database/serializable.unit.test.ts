import { Prisma } from "@cg/db";
import { describe, expect, it, vi } from "vitest";
import { runSerializableWithRetry } from "./serializable.js";
describe("runSerializableWithRetry", () => {
  it("retries the entire transaction after P2034", async () => {
    const work = vi.fn().mockResolvedValue("ok"),
      error = new Prisma.PrismaClientKnownRequestError("race", {
        code: "P2034",
        clientVersion: "test",
      }),
      db = {
        $transaction: vi
          .fn()
          .mockImplementationOnce(async (fn: (tx: unknown) => unknown) => {
            await fn({ attempt: 1 });
            throw error;
          })
          .mockImplementationOnce((fn: (tx: unknown) => unknown) =>
            fn({ attempt: 2 }),
          ),
      };
    await expect(runSerializableWithRetry(db as never, work)).resolves.toBe(
      "ok",
    );
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(work).toHaveBeenCalledTimes(2);
  });
  it("returns a stable error after bounded exhaustion", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("race", {
        code: "P2034",
        clientVersion: "test",
      }),
      db = { $transaction: vi.fn().mockRejectedValue(error) };
    await expect(
      runSerializableWithRetry(db as never, vi.fn(), 2),
    ).rejects.toMatchObject({
      code: "SERIALIZATION_RETRY_EXHAUSTED",
      status: 503,
    });
    expect(db.$transaction).toHaveBeenCalledTimes(2);
  });
  it("does not retry unknown failures", async () => {
    const db = { $transaction: vi.fn().mockRejectedValue(new Error("unsafe")) };
    await expect(
      runSerializableWithRetry(db as never, vi.fn()),
    ).rejects.toThrow("unsafe");
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
});
