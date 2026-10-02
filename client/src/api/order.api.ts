import { api } from "./client";

export const orderApi = {
  place: (data: any) => api.post("/orders", data).then((r) => r.data),
  mine: () => api.get("/orders").then((r) => r.data),
  detail: (id: number | string) => api.get(`/orders/${id}`).then((r) => r.data),
};

export const vendorApi = {
  stats: () => api.get("/vendor/stats").then((r) => r.data),
  products: () => api.get("/vendor/products").then((r) => r.data),
  createProduct: (data: any) => api.post("/vendor/products", data).then((r) => r.data),
  updateProduct: (id: number, data: any) => api.patch(`/vendor/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id: number) => api.delete(`/vendor/products/${id}`).then((r) => r.data),
  orders: () => api.get("/vendor/orders").then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get("/admin/stats").then((r) => r.data),
  users: (role?: string) => api.get("/admin/users", { params: { role } }).then((r) => r.data),
  updateUserStatus: (id: number, status: string) => api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  pendingVendors: () => api.get("/admin/vendors/pending").then((r) => r.data),
  approveVendor: (id: number) => api.patch(`/admin/vendors/${id}/approve`).then((r) => r.data),
  products: (status?: string) => api.get("/admin/products", { params: { status } }).then((r) => r.data),
  updateProductStatus: (id: number, status: string) => api.patch(`/admin/products/${id}/status`, { status }).then((r) => r.data),
  orders: () => api.get("/admin/orders").then((r) => r.data),
  commission: () => api.get("/admin/commission").then((r) => r.data),
  setCommission: (rate: number) => api.patch("/admin/commission", { rate }).then((r) => r.data),
  vendorPerformance: () => api.get("/admin/reports/vendor-performance").then((r) => r.data),
};

export const orderStatusApi = {
  update: (orderId: number, status: string) => api.patch(`/orders/${orderId}/status`, { status }).then((r) => r.data),
};
