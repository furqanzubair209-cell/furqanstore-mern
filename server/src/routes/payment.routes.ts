import { Router } from "express";
import express from "express";
import { requireAuth } from "../middleware/auth";
import { createStripeSession, stripeWebhook, verifySession } from "../controllers/payment.controller";

const router = Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

router.use(requireAuth);
router.post("/create-checkout-session", createStripeSession);
router.get("/verify-session", verifySession);

export default router;
