import { describe, expect, it } from "vitest";
import { assertSeedAllowed } from "./seed-policy.js";
describe("seed policy", () => {
  it.each([undefined, "", "production", "staging"])(
    "fails closed for %s",
    (mode) => {
      expect(() => assertSeedAllowed(mode)).toThrow(
        "Seed is disabled outside development/test",
      );
    },
  );
  it.each(["development", "test"])("allows %s only", (mode) => {
    expect(() => assertSeedAllowed(mode)).not.toThrow();
  });
});
