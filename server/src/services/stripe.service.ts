import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export { stripe };

export async function createCheckoutSession(userId: number, shippingAddress?: string) {
  if (!/^sk_test_[A-Za-z0-9]{20,}$/.test(process.env.STRIPE_SECRET_KEY || "")) {
    throw new AppError(
      "Stripe test mode is not configured with an API key. Please add your STRIPE_SECRET_KEY in server/.env (e.g. sk_test_... from https://dashboard.stripe.com/test/apikeys).",
      400
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  for (const item of cartItems) {
    if (item.product.status !== "ACTIVE") {
      throw new AppError(`"${item.product.name}" is not available`, 400);
    }
    if (item.quantity > item.product.stock) {
      throw new AppError(`Only ${item.product.stock} unit(s) of "${item.product.name}" left`, 400);
    }
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
    price_data: {
      currency: "pkr",
      product_data: {
        name: item.product.name,
        ...(item.product.imageUrl ? { images: [item.product.imageUrl] } : {}),
      },
      unit_amount: Math.round(Number(item.product.price) * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    metadata: {
      userId: String(userId),
      shippingAddress: shippingAddress?.trim() || "Paid via Stripe",
    },
    success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/cancel`,
  });

  return session;
}
