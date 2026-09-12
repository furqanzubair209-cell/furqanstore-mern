import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;
    const msg = await prisma.contactMessage.create({ data: { name, email, subject, message } });
    return ok(res, msg, "Message sent — we'll get back to you soon", 201);
  })
);

router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    return ok(res, messages);
  })
);

export default router;
