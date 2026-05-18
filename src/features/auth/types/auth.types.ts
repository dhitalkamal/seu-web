/** Auth-related TypeScript types matching the IAM service API contract. */

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone?: string | null;
  bio?: string | null;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  date_joined: string;
  org_id?: string;
  role?: string;
};

/** Wraps every IAM API response in {data, error, meta}. */
export type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string; details: unknown } | null;
  meta: { request_id: string; timestamp: string };
};

/** POST /auth/login/ - no MFA. */
export type LoginTokens = {
  mfa_required: false;
  user_id: string;
  access_token: string;
  refresh_token: string;
};

/** POST /auth/login/ - MFA required. */
export type MFAChallenge = {
  mfa_required: true;
  user_id: string;
  access_token: null;
  refresh_token: null;
};

export type LoginResponseData = LoginTokens | MFAChallenge;
export type LoginResponse = ApiResponse<LoginResponseData>;

/** POST /auth/register/ */
export type RegisterRequest = {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
};

/** POST /auth/mfa/challenge/ */
export type MFAChallengeRequest = { user_id: string; code: string };
export type MFAChallengeResponse = ApiResponse<{
  access_token: string;
  refresh_token: string;
  used_backup_code: boolean;
}>;

/** POST /auth/email/verify/ */
export type VerifyEmailRequest = { email: string; otp: string };

/** POST /auth/password/reset/ */
export type PasswordResetRequest = { email: string };

/** POST /auth/password/reset/verify-otp/ */
export type VerifyResetOTPRequest = { email: string; otp: string };

/** POST /auth/password/reset/confirm/ */
export type ConfirmResetRequest = {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
};

/** POST /auth/password/change/ */
export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

/** PATCH /profile/me/ */
export type ProfileUpdateRequest = {
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
};

/** GET /auth/sessions/ */
export type SessionInfo = {
  jti: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

export type MessageResponse = ApiResponse<{ message: string }>;
export type RegisterResponse = ApiResponse<User>;
export type ProfileResponse = ApiResponse<User>;
