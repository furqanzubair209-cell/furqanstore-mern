import { api } from "./client";

export const authApi = {
  register: (data: any) => api.post("/auth/register", data).then((r) => r.data),
  login: (data: any) => api.post("/auth/login", data).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};
