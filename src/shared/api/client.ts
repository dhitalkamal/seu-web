import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { WEB_AUTH_STORAGE_KEY, useAuthStore } from "@/shared/store/auth.store";

const LEGACY_AUTH_STORAGE_KEY = "sansaar-auth";

function getAuthBlob(): string | null {
  return (
    localStorage.getItem(WEB_AUTH_STORAGE_KEY) ?? localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
  );
}

/** Read access token from Zustand in-memory state first, then localStorage fallback. */
function getAccessToken(): string | null {
  const inMemory = useAuthStore.getState().accessToken;
  if (inMemory) return inMemory;
  try {
    const raw = getAuthBlob();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Read refresh token from Zustand in-memory state first, then localStorage fallback. */
function getRefreshToken(): string | null {
  const inMemory = useAuthStore.getState().refreshToken;
  if (inMemory) return inMemory;
  try {
    const raw = getAuthBlob();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { refreshToken?: string | null } };
    return parsed.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

// service prefix to render URL mapping - only used in production (when VITE_RENDER_IAM is set)
const SERVICE_MAP: Record<string, string> = {
  "/iam/": import.meta.env.VITE_RENDER_IAM || "",
  "/event/": import.meta.env.VITE_RENDER_EVENT || "",
  "/org/": import.meta.env.VITE_RENDER_MANAGEMENT || "",
  "/venue/": import.meta.env.VITE_RENDER_MANAGEMENT || "",
  "/volunteer/": import.meta.env.VITE_RENDER_MANAGEMENT || "",
  "/community/": import.meta.env.VITE_RENDER_MANAGEMENT || "",
  "/marketing/": import.meta.env.VITE_RENDER_MANAGEMENT || "",
  "/participation/": import.meta.env.VITE_RENDER_PARTICIPATION || "",
  "/payment/": import.meta.env.VITE_RENDER_PAYMENT || "",
  "/notification/": import.meta.env.VITE_RENDER_NOTIFICATION || "",
  "/intelligence/": import.meta.env.VITE_RENDER_INTELLIGENCE || "",
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  adapter: "fetch",
});

// rewrite service prefix to render URL in production
client.interceptors.request.use((config) => {
  const url = config.url ?? "";
  for (const [prefix, renderUrl] of Object.entries(SERVICE_MAP)) {
    if (url.startsWith(prefix) && renderUrl) {
      config.baseURL = renderUrl;
      config.url = url.slice(prefix.length - 1);
      break;
    }
  }
  return config;
});

// set content-type to json by default, but let axios auto-detect for FormData
client.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = config.headers["Content-Type"] ?? "application/json";
  }
  return config;
});

// * Attach Bearer token to every request
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function drainQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

// * Silent token refresh on 401, then retry the original request
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // not a 401 - pass through
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // already retried after refresh, or this IS the refresh call - force logout
    if (original._retried || original.url?.includes("/auth/token/refresh/")) {
      localStorage.removeItem(WEB_AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      window.location.href = "/login";
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      localStorage.removeItem(WEB_AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // another request is already refreshing - queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          original._retried = true;
          resolve(client(original));
        });
        // if refresh fails, reject queued requests
        setTimeout(() => reject(error), 10000);
      });
    }

    isRefreshing = true;
    original._retried = true;

    try {
      const iamBase = SERVICE_MAP["/iam/"] || (import.meta.env.VITE_API_BASE_URL || "");
      const res = await axios.post<{ access: string; refresh?: string }>(
        `${iamBase}/api/v1/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      const newAccess = res.data.access;
      const newRefresh = res.data.refresh ?? refreshToken;

      // update localStorage so getAccessToken reads the fresh value immediately
      const raw = getAuthBlob();
      if (raw) {
        const blob = JSON.parse(raw) as { state: Record<string, unknown> };
        blob.state.accessToken = newAccess;
        blob.state.refreshToken = newRefresh;
        localStorage.setItem(WEB_AUTH_STORAGE_KEY, JSON.stringify(blob));
        localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      }

      // keep Zustand in-memory state in sync so store readers never see stale tokens
      useAuthStore.getState().updateTokens(newAccess, newRefresh);

      drainQueue(newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return client(original);
    } catch {
      pendingQueue = [];
      localStorage.removeItem(WEB_AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
