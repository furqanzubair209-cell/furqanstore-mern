import { api } from "./client";

export const productApi = {
  list: (params: Record<string, any> = {}) => api.get("/products", { params }).then((r) => r.data),
  detail: (id: number | string) => api.get(`/products/${id}`).then((r) => r.data),
  categories: () => api.get("/products/categories").then((r) => r.data),
};
