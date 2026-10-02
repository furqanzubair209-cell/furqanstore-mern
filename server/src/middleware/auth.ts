import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { fail } from "../utils/response";

export type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: Role };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return fail(res, "Authentication required", 401);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, "Authentication required", 401);
    if (!roles.includes(req.user.role)) {
      return fail(res, "You do not have permission to perform this action", 403);
    }
    next();
  };
}

export const requireAdmin = requireRole("ADMIN", "SUPER_ADMIN");
export const requireVendor = requireRole("VENDOR");
export const requireSuperAdmin = requireRole("SUPER_ADMIN");
