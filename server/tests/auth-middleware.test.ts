import { describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import { requireAdmin, requireAuth, requireRole } from "../src/middleware/auth";
import { signAccessToken } from "../src/utils/jwt";

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid token", () => {
    const req = { headers: { authorization: "Bearer garbage" } } as Request;
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next() for a valid token", () => {
    const token = signAccessToken({ userId: 7, role: "CUSTOMER" });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ userId: 7, role: "CUSTOMER" });
  });
});

describe("requireRole / requireAdmin", () => {
  it("allows a matching role through", () => {
    const req = { user: { userId: 1, role: "ADMIN" } } as Request;
    const res = makeRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("blocks a non-matching role with 403", () => {
    const req = { user: { userId: 1, role: "CUSTOMER" } } as Request;
    const res = makeRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks when no user is attached", () => {
    const req = {} as Request;
    const res = makeRes();
    const next = vi.fn();

    requireRole("VENDOR")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
