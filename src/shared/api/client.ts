import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

/** Read access token from the Zustand persisted store blob in localStorage. */
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem("sansaar-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Read refresh token from the Zustand persisted store blob in localStorage. */
function getStoredRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem("sansaar-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { refreshToken?: string | null } };
    return parsed.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// * Request interceptor: attach Bearer token
client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// * Silent refresh state
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// * Response interceptor: attempt token refresh on 401, then retry
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    original._retried = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(client(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const res = await axios.post<{ data: { access: string; refresh: string } }>(
        `${import.meta.env.VITE_API_BASE_URL}/iam/api/v1/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      const newAccess = res.data.data.access;
      const newRefresh = res.data.data.refresh ?? refreshToken;

      // Update Zustand store via the persisted key
      const raw = localStorage.getItem("sansaar-auth");
      if (raw) {
        const blob = JSON.parse(raw) as { state: Record<string, unknown> };
        blob.state.accessToken = newAccess;
        blob.state.refreshToken = newRefresh;
        localStorage.setItem("sansaar-auth", JSON.stringify(blob));
      }

      drainQueue(newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return client(original);
    } catch {
      refreshQueue = [];
      localStorage.removeItem("sansaar-auth");
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
