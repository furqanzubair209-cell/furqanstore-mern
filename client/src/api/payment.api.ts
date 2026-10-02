import { api } from "./client";

export const paymentApi = {
  createCheckoutSession: (data?: { shippingAddress?: string }) =>
    api.post("/payments/create-checkout-session", data).then((r) => r.data),
  verifySession: (sessionId: string) =>
    api.get("/payments/verify-session", { params: { session_id: sessionId } }).then((r) => r.data),
};
