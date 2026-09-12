import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { hashPassword, comparePassword } from "../utils/password";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const REFRESH_COOKIE = "fs_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function issueSession(res: Response, user: { id: number; role: any }) {
  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  return accessToken;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, role, vendorName } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409);

  // Customers self-activate; anyone requesting a vendor account starts
  // PENDING until an admin approves them (mirrors the original workflow).
  const requestedRole = role === "VENDOR" ? "VENDOR" : "CUSTOMER";
  const status = requestedRole === "VENDOR" ? "PENDING" : "ACTIVE";

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      password: await hashPassword(password),
      role: requestedRole,
      status,
      vendorName: requestedRole === "VENDOR" ? vendorName : null,
    },
  });

  if (requestedRole === "VENDOR") {
    return ok(
      res,
      { id: user.id, status: user.status },
      "Vendor application submitted. An admin will review your account shortly.",
      201
    );
  }

  const accessToken = await issueSession(res, user);
  return ok(
    res,
    { accessToken, user: sanitize(user) },
    "Account created successfully",
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new AppError("This account has been suspended. Contact support.", 403);
  }
  if (user.status === "PENDING") {
    throw new AppError("Your vendor account is awaiting admin approval", 403);
  }

  const accessToken = await issueSession(res, user);
  return ok(res, { accessToken, user: sanitize(user) }, "Logged in successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError("No refresh token provided", 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Session expired, please log in again", 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError("Session expired, please log in again", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== "ACTIVE") throw new AppError("Account no longer active", 401);

  // Rotate: invalidate the old refresh token, issue a new pair.
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const accessToken = await issueSession(res, user);

  return ok(res, { accessToken, user: sanitize(user) }, "Session refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => null);
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  return ok(res, null, "Logged out");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError("User not found", 404);
  return ok(res, sanitize(user));
});

function sanitize(user: any) {
  const { password, ...rest } = user;
  return rest;
}
