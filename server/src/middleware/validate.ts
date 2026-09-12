import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { fail } from "../utils/response";

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, "Validation failed", 422, err.flatten().fieldErrors);
    }
    next(err);
  }
};
