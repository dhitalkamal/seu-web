import client from "@/shared/api/client";
import type {
  ConfirmResetRequest,
  LoginResponse,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MessageResponse,
  PasswordResetRequest,
  ProfileResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyResetOTPRequest,
} from "@/features/auth/types/auth.types";

const AUTH = "/iam/api/v1/auth";
const PROFILE = "/iam/api/v1/profile";

/** @returns Full login response — either tokens or mfa_required signal. */
async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>(`${AUTH}/login/`, { email, password });
  return res.data;
}

/** @returns Newly created user profile. */
async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const res = await client.post<RegisterResponse>(`${AUTH}/register/`, payload);
  return res.data;
}

/** Blacklists the refresh token server-side. */
async function logout(refreshToken: string): Promise<void> {
  await client.post(`${AUTH}/logout/`, { refresh_token: refreshToken });
}

/** Submits a TOTP or backup code to complete MFA login. */
async function mfaChallenge(payload: MFAChallengeRequest): Promise<MFAChallengeResponse> {
  const res = await client.post<MFAChallengeResponse>(`${AUTH}/mfa/challenge/`, payload);
  return res.data;
}

/** Sends a password-reset OTP to the email address (step 1 of 3). */
async function requestPasswordReset(payload: PasswordResetRequest): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/password/reset/`, payload);
  return res.data;
}

/** Validates the OTP without consuming it (step 2 of 3). */
async function verifyPasswordResetOTP(payload: VerifyResetOTPRequest): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/password/reset/verify-otp/`, payload);
  return res.data;
}

/** Consumes the OTP and sets the new password (step 3 of 3). */
async function confirmPasswordReset(payload: ConfirmResetRequest): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/password/reset/confirm/`, payload);
  return res.data;
}

/** Fetches the authenticated user's full profile. */
async function getProfile(): Promise<ProfileResponse> {
  const res = await client.get<ProfileResponse>(`${PROFILE}/me/`);
  return res.data;
}

const authApi = {
  login,
  register,
  logout,
  mfaChallenge,
  requestPasswordReset,
  verifyPasswordResetOTP,
  confirmPasswordReset,
  getProfile,
};

export default authApi;
