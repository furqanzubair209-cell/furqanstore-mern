import axios from "axios";
import { useAuthStore } from "../store/auth.store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401 (expired access token), try once to refresh via the cookie,
// then replay the original request. If that also fails, log the user out.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || refreshAccessToken();
        const token = await refreshing;
        refreshing = null;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const { accessToken, user } = res.data.data;
    useAuthStore.getState().setSession(accessToken, user);
    return accessToken as string;
  } catch {
    return null;
  }
}
