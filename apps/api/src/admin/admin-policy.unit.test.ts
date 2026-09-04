import { describe, expect, it } from "vitest";
describe("admin adjustment validation", () => {
  it("requires positive integer units and applies demo cap", () => {
    const valid = (text: string) =>
      /^[1-9][0-9]*$/.test(text) && BigInt(text) <= 1_000_000n;
    expect(valid("1")).toBe(true);
    expect(valid("0")).toBe(false);
    expect(valid("1.5")).toBe(false);
    expect(valid("1000001")).toBe(false);
  });
});
