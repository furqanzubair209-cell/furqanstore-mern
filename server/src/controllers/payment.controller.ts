import { Request, Response } from "express";
import type Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { createCheckoutSession, stripe } from "../services/stripe.service";
import { placeOrder } from "../services/order.service";

async function fulfillPaidSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return null;
  const userId = Number(session.metadata?.userId);
  if (!userId) return null;
  return placeOrder({
    userId,
    shippingAddress: session.metadata?.shippingAddress || "Paid via Stripe",
    paymentMethod: "CARD",
    stripeSessionId: session.id,
  });
}

export const createStripeSession = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress } = req.body || {};
  if (!shippingAddress?.trim()) throw new AppError("Shipping address is required", 422);
  const session = await createCheckoutSession(req.user!.userId, shippingAddress);
  return ok(res, { url: session.url }, "Checkout session created");
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ message: "Missing signature" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await fulfillPaidSession(event.data.object as Stripe.Checkout.Session);
    } catch (err: any) {
      console.error("Order creation after Stripe payment failed:", err.message);
      return res.status(500).json({ message: "Order fulfilment failed" });
    }
  }

  res.json({ received: true });
};

export const verifySession = asyncHandler(async (req: Request, res: Response) => {
  const { session_id } = req.query;
  if (!session_id) throw new AppError("Session ID required", 400);

  const session = await stripe.checkout.sessions.retrieve(session_id as string);
  if (Number(session.metadata?.userId) !== req.user!.userId) {
    throw new AppError("This payment session does not belong to you", 403);
  }

  let orderId: number | null = null;
  try {
    const order = await fulfillPaidSession(session);
    orderId = order?.id ?? null;
  } catch (err: any) {
    console.error("Order creation in verifySession failed:", err.message);
  }

  return ok(res, {
    status: session.payment_status,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    orderCreated: orderId !== null,
    orderId,
  });
});
