import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { fail } from "../utils/response";

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const field = issue.path.length > 1 && (issue.path[0] === "body" || issue.path[0] === "query" || issue.path[0] === "params")
          ? String(issue.path[1])
          : String(issue.path[issue.path.length - 1] || "general");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return fail(res, "Validation failed", 422, fieldErrors);
    }
    next(err);
  }
};
