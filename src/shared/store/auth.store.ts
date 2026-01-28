import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";

export const WEB_AUTH_STORAGE_KEY = "sansaar-web-auth";
const LEGACY_AUTH_STORAGE_KEY = "sansaar-auth";

function migrateLegacyAuthStorage(): void {
  const hasWebAuth = localStorage.getItem(WEB_AUTH_STORAGE_KEY);
  if (hasWebAuth) return;

  const legacyAuth = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (!legacyAuth) return;

  localStorage.setItem(WEB_AUTH_STORAGE_KEY, legacyAuth);
}

migrateLegacyAuthStorage();

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Called after a successful login. */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** Updates only the tokens after a silent refresh, does not touch user or isAuthenticated. */
  updateTokens: (accessToken: string, refreshToken: string) => void;
  /** Clears all auth state -- call on logout or session expiry. */
  clearAuth: () => void;
};

/** Persisted auth store -- survives page refresh via localStorage under a web-only key. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: WEB_AUTH_STORAGE_KEY }
  )
);
