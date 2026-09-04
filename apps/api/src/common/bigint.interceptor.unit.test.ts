import { describe, expect, it } from "vitest";
import { serializeResponse } from "./bigint.interceptor.js";
class DecimalLike {
  toJSON() {
    return "12.50";
  }
}
describe("safe response serialization", () => {
  it("maps values without mutation", () => {
    const date = new Date("2026-01-02T03:04:05.000Z"),
      source = {
        amount: 2n,
        date,
        nested: [null, { value: 3n }],
        missing: undefined,
        buffer: Buffer.from("ok"),
        decimal: new DecimalLike(),
      };
    expect(serializeResponse(source)).toEqual({
      amount: "2",
      date: date.toISOString(),
      nested: [null, { value: "3" }],
      buffer: { type: "Buffer", data: "b2s=" },
      decimal: "12.50",
    });
    expect(source.amount).toBe(2n);
  });
  it("rejects circular responses predictably", () => {
    const value: { self?: unknown } = {};
    value.self = value;
    expect(() => serializeResponse(value)).toThrow("Circular response");
  });
});
