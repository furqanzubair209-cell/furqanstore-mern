import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "../src/utils/password";

describe("password utils", () => {
  it("hashes a password to a value different from the plaintext", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a matching password", async () => {
    const hash = await hashPassword("my-secret-pass");
    await expect(comparePassword("my-secret-pass", hash)).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("my-secret-pass");
    await expect(comparePassword("wrong-pass", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same input on each call", async () => {
    const a = await hashPassword("same-input");
    const b = await hashPassword("same-input");
    expect(a).not.toBe(b);
  });
});
