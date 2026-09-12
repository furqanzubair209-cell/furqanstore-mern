import { api } from "./client";

export const addressApi = {
  list: () => api.get("/account/addresses").then((r) => r.data),
  create: (data: { label?: string; line1: string; city: string; isDefault?: boolean }) =>
    api.post("/account/addresses", data).then((r) => r.data),
  update: (id: number, data: Partial<{ label: string; line1: string; city: string; isDefault: boolean }>) =>
    api.patch(`/account/addresses/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/account/addresses/${id}`).then((r) => r.data),
};

export const wishlistApi = {
  list: () => api.get("/account/wishlist").then((r) => r.data),
  add: (productId: number) => api.post(`/account/wishlist/${productId}`).then((r) => r.data),
  remove: (productId: number) => api.delete(`/account/wishlist/${productId}`).then((r) => r.data),
};

export const notificationApi = {
  list: () => api.get("/account/notifications").then((r) => r.data),
  markRead: (id: number) => api.patch(`/account/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch("/account/notifications/read-all").then((r) => r.data),
};
