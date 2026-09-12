import jwt from "jsonwebtoken";
import crypto from "crypto";

export type JwtPayload = {
  userId: number;
  role: "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER";
};

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// Refresh tokens are stored hashed (never in plaintext) so a leaked
// database dump can't be replayed as a live session.
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
