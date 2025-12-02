import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Called after a successful login or token refresh. */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** Clears all auth state — call on logout or session expiry. */
  clearAuth: () => void;
};

/** Persisted auth store — survives page refresh via localStorage under key "sansaar-auth". */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: "sansaar-auth" }
  )
);
