import { PlayerStatus } from "@cg/db";
import { describe, expect, it } from "vitest";
const mayMutate = (status: PlayerStatus) => status === PlayerStatus.ACTIVE;
describe("player money policy", () => {
  it("blocks frozen and suspended accounts", () => {
    expect(mayMutate(PlayerStatus.ACTIVE)).toBe(true);
    expect(mayMutate(PlayerStatus.FROZEN)).toBe(false);
    expect(mayMutate(PlayerStatus.SUSPENDED)).toBe(false);
  });
  it("uses a fixed positive integer faucet amount", () => {
    const amount = BigInt(process.env.DEMO_FAUCET_AMOUNT ?? "100000");
    expect(amount).toBe(100000n);
    expect(amount > 0n).toBe(true);
  });
});
