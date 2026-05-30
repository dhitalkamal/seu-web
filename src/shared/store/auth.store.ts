import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";

export const WEB_AUTH_STORAGE_KEY = "sansaar-web-auth";
const REMEMBER_KEY = "sansaar-remember-me";
const LEGACY_AUTH_STORAGE_KEY = "sansaar-auth";

function migrateLegacyAuthStorage(): void {
  const hasWebAuth = localStorage.getItem(WEB_AUTH_STORAGE_KEY);
  if (hasWebAuth) return;

  const legacyAuth = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (!legacyAuth) return;

  localStorage.setItem(WEB_AUTH_STORAGE_KEY, legacyAuth);
}

migrateLegacyAuthStorage();

/** Returns true if the user checked "remember me" on login. */
export function isRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

/** Persist the remember-me preference (always in localStorage since it must survive session close). */
export function setRememberMe(value: boolean): void {
  localStorage.setItem(REMEMBER_KEY, String(value));
  if (value) {
    // move auth from sessionStorage to localStorage if switching
    const session = sessionStorage.getItem(WEB_AUTH_STORAGE_KEY);
    if (session) {
      localStorage.setItem(WEB_AUTH_STORAGE_KEY, session);
      sessionStorage.removeItem(WEB_AUTH_STORAGE_KEY);
    }
  } else {
    // move auth from localStorage to sessionStorage
    const local = localStorage.getItem(WEB_AUTH_STORAGE_KEY);
    if (local) {
      sessionStorage.setItem(WEB_AUTH_STORAGE_KEY, local);
      localStorage.removeItem(WEB_AUTH_STORAGE_KEY);
    }
  }
}

// pick storage based on remember-me: localStorage persists, sessionStorage clears on browser close
const adaptiveStorage: StateStorage = {
  getItem: (name) => {
    return localStorage.getItem(name) ?? sessionStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (isRememberMe()) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
};

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
      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem(REMEMBER_KEY);
      },
    }),
    { name: WEB_AUTH_STORAGE_KEY, storage: createJSONStorage(() => adaptiveStorage) }
  )
);
