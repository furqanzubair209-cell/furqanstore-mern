import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { fail } from "../utils/response";

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// Centralized so every route gets consistent { success, message, errors }
// shapes and so raw Prisma/driver errors never leak to the client.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.message, err.status, err.errors);
  }

  const anyErr = err as { code?: string; meta?: { target?: string[] } };
  if (anyErr?.code === "P2002") {
    return fail(res, `A record with this ${anyErr.meta?.target?.join(", ") ?? "value"} already exists`, 409);
  }
  if (anyErr?.code === "P2025") {
    return fail(res, "Requested record was not found", 404);
  }

  console.error(err);
  return fail(res, "Internal server error", 500);
}
