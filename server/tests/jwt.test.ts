import { describe, expect, it } from "vitest";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../src/utils/jwt";

const payload = { userId: 42, role: "VENDOR" as const };

describe("jwt utils", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it("round-trips a refresh token", () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it("rejects an access token with a refresh-token verifier", () => {
    const token = signAccessToken(payload);
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("hashes the same token to the same value", () => {
    const a = hashToken("some-refresh-token");
    const b = hashToken("some-refresh-token");
    expect(a).toBe(b);
  });

  it("hashes different tokens to different values", () => {
    expect(hashToken("token-one")).not.toBe(hashToken("token-two"));
  });
});
