import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { WEB_AUTH_STORAGE_KEY, useAuthStore } from "@/shared/store/auth.store";

const LEGACY_AUTH_STORAGE_KEY = "sansaar-auth";

function getAuthBlob(): string | null {
  return (
    localStorage.getItem(WEB_AUTH_STORAGE_KEY) ?? localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
  );
}

/** Read access token from the Zustand persisted store in localStorage. */
function getAccessToken(): string | null {
  try {
    const raw = getAuthBlob();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Read refresh token from the Zustand persisted store in localStorage. */
function getRefreshToken(): string | null {
  try {
    const raw = getAuthBlob();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { refreshToken?: string | null } };
    return parsed.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
      const res = await axios.post<{ access: string; refresh?: string }>(
        `${import.meta.env.VITE_API_BASE_URL}/iam/api/v1/auth/token/refresh/`,
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
