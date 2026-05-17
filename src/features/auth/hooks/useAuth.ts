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
