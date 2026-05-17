import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import authApi from "@/features/auth/api/auth.api";
import type {
  ConfirmResetRequest,
  MFAChallengeRequest,
  PasswordResetRequest,
  RegisterRequest,
  VerifyResetOTPRequest,
} from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth.store";

/** Extract the human-readable error message from an Axios API error. */
export function getApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
  return axiosErr.response?.data?.error?.message ?? "Something went wrong. Please try again.";
}

/** Central auth hook — exposes session state and all auth mutations. */
export function useAuth() {
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
    onSettled: () => clearAuth(),
  });

  const mfaChallengeMutation = useMutation({
    mutationFn: (payload: MFAChallengeRequest) => authApi.mfaChallenge(payload),
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

  return {
    user,
    isAuthenticated,
    loginMutation,
    registerMutation,
    logoutMutation,
    mfaChallengeMutation,
    requestPasswordResetMutation,
    verifyPasswordResetOTPMutation,
    confirmPasswordResetMutation,
    setAuth,
    clearAuth,
  };
}
