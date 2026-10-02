import { api } from "./client";

export const cartApi = {
  get: () => api.get("/cart").then((r) => r.data),
  add: (productId: number, quantity = 1) => api.post("/cart", { productId, quantity }).then((r) => r.data),
  update: (id: number, quantity: number) => api.patch(`/cart/${id}`, { quantity }).then((r) => r.data),
  remove: (id: number) => api.delete(`/cart/${id}`).then((r) => r.data),
};
