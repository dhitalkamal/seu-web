import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import authApi from "@/features/auth/api/auth.api";
import type {
  ChangePasswordRequest,
  ConfirmResetRequest,
  MFAChallengeRequest,
  PasswordResetRequest,
  ProfileUpdateRequest,
  RegisterRequest,
  VerifyEmailRequest,
  VerifyResetOTPRequest,
} from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth.store";
import { useOrgStore } from "@/shared/store/org.store";

/** Extract the human-readable error message from an Axios API error. */
export function getApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
  return axiosErr.response?.data?.error?.message ?? "Something went wrong. Please try again.";
}

/** Central auth hook — session state + all auth/profile mutations. */
export function useAuth() {
  const qc = useQueryClient();
  const { user, isAuthenticated, refreshToken, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) await authApi.logout(refreshToken);
    },
    onSettled: () => {
      clearAuth();
      useOrgStore.getState().clearOrg();
      qc.clear();
    },
  });

  const mfaChallengeMutation = useMutation({
    mutationFn: (payload: MFAChallengeRequest) => authApi.mfaChallenge(payload),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authApi.verifyEmail(payload),
  });

  const resendOTPMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerificationOTP(email),
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: (payload: PasswordResetRequest) => authApi.requestPasswordReset(payload),
  });

  const verifyPasswordResetOTPMutation = useMutation({
    mutationFn: (payload: VerifyResetOTPRequest) => authApi.verifyPasswordResetOTP(payload),
  });

  const confirmPasswordResetMutation = useMutation({
    mutationFn: (payload: ConfirmResetRequest) => authApi.confirmPasswordReset(payload),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => authApi.updateProfile(payload),
    onSuccess: (res) => {
      const stored = useAuthStore.getState();
      if (stored.accessToken && stored.refreshToken) {
        setAuth(res.data, stored.accessToken, stored.refreshToken);
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      clearAuth();
      useOrgStore.getState().clearOrg();
      qc.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    loginMutation,
    registerMutation,
    logoutMutation,
    mfaChallengeMutation,
    verifyEmailMutation,
    resendOTPMutation,
    requestPasswordResetMutation,
    verifyPasswordResetOTPMutation,
    confirmPasswordResetMutation,
    changePasswordMutation,
    updateProfileMutation,
    deleteAccountMutation,
    setAuth,
    clearAuth,
  };
}

/** Fetches and caches the authenticated user's full profile. */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authApi.getProfile(),
    select: (res) => res.data,
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

/** Fetches and caches the user's active sessions. */
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => authApi.listSessions(),
    select: (res) => res.data,
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

/**
 * Bootstraps user profile data on app mount. Call once near the app root
 * (e.g. inside AppLayout). Fetches GET /profile/me/ and syncs the full
 * user object (first_name, last_name, phone, bio, etc.) into the auth store
 * so every page has real data instead of the skeleton set at login.
 */
export function useProfileBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !refreshToken || fetched.current) return;
    fetched.current = true;

    authApi
      .getProfile()
      .then((res) => {
        // ! sync the full user object into the store — replaces the skeleton from login
        setAuth(res.data, accessToken, refreshToken);
      })
      .catch(() => {
        // non-fatal — the user just keeps the skeleton data from login
      });
  }, [isAuthenticated, accessToken, refreshToken, setAuth]);
}
