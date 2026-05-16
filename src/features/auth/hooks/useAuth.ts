import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import authApi from "@/features/auth/api/auth.api";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  MFAChallengeRequest,
  RegisterRequest,
} from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth.store";

/** Extract a readable error message from an Axios error response. */
export function getApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
  return axiosErr.response?.data?.error?.message ?? "Something went wrong. Please try again.";
}

/** Central auth hook -- exposes session state and all auth mutations. */
export function useAuth() {
  const { user, isAuthenticated, refreshToken, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
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

  const verifyMFAMutation = useMutation({
    mutationFn: (payload: MFAChallengeRequest) => authApi.verifyMFA(payload),
    onSuccess: (res) => {
      const { access, refresh, user: u } = res.data;
      setAuth(u, access, refresh);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload),
  });

  return {
    user,
    isAuthenticated,
    loginMutation,
    registerMutation,
    logoutMutation,
    verifyMFAMutation,
    forgotPasswordMutation,
    setAuth,
    clearAuth,
  };
}
