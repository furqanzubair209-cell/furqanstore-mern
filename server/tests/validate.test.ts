import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Request, Response } from "express";
import { validate } from "../src/middleware/validate";

const schema = z.object({
  body: z.object({
    email: z.string().email(),
    age: z.number().min(18),
  }),
});

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("validate middleware", () => {
  it("calls next() when the body matches the schema", () => {
    const req = { body: { email: "a@b.com", age: 21 }, query: {}, params: {} } as unknown as Request;
    const res = makeRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds with 422 and field errors when the body is invalid", () => {
    const req = { body: { email: "not-an-email", age: 10 }, query: {}, params: {} } as unknown as Request;
    const res = makeRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.errors).toHaveProperty("email");
    expect(payload.errors).toHaveProperty("age");
  });
});
