import { useAuthStore } from "../store/auth.store";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  params?: Record<string, unknown>;
};

export class ApiError extends Error {
  response: { status: number; data: any };

  constructor(status: number, data: any) {
    super(data?.message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.response = { status, data };
  }
}

function buildUrl(path: string, params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, String(value));
  });
  const qs = query.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`;
}

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const body = await parseBody(res);
    const { accessToken, user } = body.data;
    useAuthStore.getState().setSession(accessToken, user);
    return accessToken as string;
  } catch {
    return null;
  }
}

async function request(method: string, path: string, body?: unknown, options: RequestOptions = {}, retried = false): Promise<{ data: any; status: number }> {
  const headers: Record<string, string> = {};
  const token = useAuthStore.getState().accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried && !path.startsWith("/auth/")) {
    refreshing = refreshing || refreshAccessToken().finally(() => { refreshing = null; });
    const newToken = await refreshing;
    if (newToken) return request(method, path, body, options, true);
    useAuthStore.getState().logout();
  }

  const data = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return { data, status: res.status };
}

export const api = {
  get: (path: string, options?: RequestOptions) => request("GET", path, undefined, options),
  post: (path: string, body?: unknown, options?: RequestOptions) => request("POST", path, body ?? {}, options),
  patch: (path: string, body?: unknown, options?: RequestOptions) => request("PATCH", path, body ?? {}, options),
  put: (path: string, body?: unknown, options?: RequestOptions) => request("PUT", path, body ?? {}, options),
  delete: (path: string, options?: RequestOptions) => request("DELETE", path, undefined, options),
};
