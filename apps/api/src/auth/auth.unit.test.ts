import argon2 from "argon2";
import { describe, expect, it } from "vitest";
describe("password policy", () => {
  it("uses Argon2id hashes", async () => {
    const hash = await argon2.hash("correct horse demo", {
      type: argon2.argon2id,
    });
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(argon2.verify(hash, "correct horse demo")).resolves.toBe(true);
  });
});
