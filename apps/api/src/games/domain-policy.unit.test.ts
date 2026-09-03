import { SettlementResult } from "@cg/db";
import { describe, expect, it } from "vitest";
import {
  deterministicResult,
  payoutFor,
  validateBet,
} from "./domain-policy.js";
describe("demo wager policy", () => {
  it("enforces inclusive integer bet bounds", () => {
    expect(validateBet(99n, 100n, 1000n)).toBe(false);
    expect(validateBet(100n, 100n, 1000n)).toBe(true);
    expect(validateBet(1001n, 100n, 1000n)).toBe(false);
  });
  it("supports deterministic loss, wins and refund payouts", () => {
    expect(payoutFor(SettlementResult.LOSS, 100n)).toBe(0n);
    expect(payoutFor(SettlementResult.WIN_SMALL, 100n)).toBe(100n);
    expect(payoutFor(SettlementResult.WIN_LARGE, 100n)).toBe(200n);
    expect(payoutFor(SettlementResult.REFUND, 100n)).toBe(100n);
    expect(deterministicResult("00000000-0000-0000-0000-000000000003")).toBe(
      SettlementResult.REFUND,
    );
  });
});
