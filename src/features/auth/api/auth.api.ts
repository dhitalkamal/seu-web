import client from "@/shared/api/client";
import type {
  ChangePasswordRequest,
  ConfirmResetRequest,
  LoginResponse,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MessageResponse,
  PasswordResetRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  RegisterRequest,
  RegisterResponse,
  SessionInfo,
  VerifyEmailRequest,
  VerifyResetOTPRequest,
} from "@/features/auth/types/auth.types";

const AUTH = "/iam/api/v1/auth";
const PROFILE = "/iam/api/v1/profile";
const GDPR = "/iam/api/v1/gdpr";

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

/** Verifies the email address using the OTP sent on registration. */
async function verifyEmail(payload: VerifyEmailRequest): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/email/verify/`, payload);
  return res.data;
}

/** Re-sends the email verification OTP. */
async function resendVerificationOTP(email: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/email/resend/`, { email });
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

/** Changes the authenticated user's password. */
async function changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/password/change/`, payload);
  return res.data;
}

// * MFA

/** Initiates MFA setup — returns secret and provisioning URI. */
async function setupMFA(): Promise<{ data: { secret: string; provisioning_uri: string } }> {
  const res = await client.post(`${AUTH}/mfa/setup/`);
  return res.data;
}

/** Enables MFA by confirming with a TOTP code. Returns one-time backup codes. */
async function enableMFA(
  code: string
): Promise<{ data: { message: string; backup_codes: string[] } }> {
  const res = await client.post(`${AUTH}/mfa/enable/`, { code });
  return res.data;
}

/** Disables MFA using a TOTP code. */
async function disableMFA(code: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${AUTH}/mfa/disable/`, { code });
  return res.data;
}

/** Returns how many unused backup codes remain. */
async function backupCodeStatus(): Promise<{ data: { remaining: number } }> {
  const res = await client.get(`${AUTH}/mfa/backup-codes/status/`);
  return res.data;
}

/** Regenerates backup codes. Requires current TOTP code. */
async function regenerateBackupCodes(code: string): Promise<{ data: { backup_codes: string[] } }> {
  const res = await client.post(`${AUTH}/mfa/backup-codes/regenerate/`, { code });
  return res.data;
}

// * Sessions

/** Lists all active sessions for the authenticated user. */
async function listSessions(): Promise<{ data: SessionInfo[] }> {
  const res = await client.get(`${AUTH}/sessions/`);
  return res.data;
}

/** Revokes a specific session by JTI. */
async function revokeSession(jti: string): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(`${AUTH}/sessions/${jti}/`);
  return res.data;
}

// * Profile

/** Fetches the authenticated user's full profile. */
async function getProfile(): Promise<ProfileResponse> {
  const res = await client.get<ProfileResponse>(`${PROFILE}/me/`);
  return res.data;
}

/** Partially updates the authenticated user's profile. */
async function updateProfile(payload: ProfileUpdateRequest): Promise<ProfileResponse> {
  const res = await client.patch<ProfileResponse>(`${PROFILE}/me/`, payload);
  return res.data;
}

/** Soft-deletes the authenticated user's account. */
async function deleteAccount(): Promise<void> {
  await client.delete(`${PROFILE}/me/`);
}

// * GDPR

/** Downloads the user's personal data as JSON. */
async function exportDataJSON(): Promise<unknown> {
  const res = await client.get(`${GDPR}/export/`);
  return res.data;
}

/** Downloads the user's personal data as CSV blob. */
async function exportDataCSV(): Promise<Blob> {
  const res = await client.get(`${GDPR}/export/?format=csv`, { responseType: "blob" });
  return res.data;
}

/** Permanently anonymises the account (GDPR erasure). */
async function requestErasure(currentPassword?: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`${GDPR}/erasure/`, {
    current_password: currentPassword ?? null,
  });
  return res.data;
}

const authApi = {
  login,
  register,
  logout,
  mfaChallenge,
  verifyEmail,
  resendVerificationOTP,
  requestPasswordReset,
  verifyPasswordResetOTP,
  confirmPasswordReset,
  changePassword,
  setupMFA,
  enableMFA,
  disableMFA,
  backupCodeStatus,
  regenerateBackupCodes,
  listSessions,
  revokeSession,
  getProfile,
  updateProfile,
  deleteAccount,
  exportDataJSON,
  exportDataCSV,
  requestErasure,
};

export default authApi;
