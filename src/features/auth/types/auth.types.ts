/** All auth-related TypeScript types for the Sansaar platform. */

export type Role =
  | "attendee"
  | "organiser"
  | "super-admin"
  | "platform-mgr"
  | "compliance"
  | "fin-admin"
  | "support"
  | "moderator";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  avatar_url?: string | null;
  mfa_enabled?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type MFAChallengeRequest = {
  user_id: string;
  code: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiMeta = {
  request_id: string;
  timestamp: string;
};

export type ApiResponse<T> = {
  data: T;
  error: ApiError | null;
  meta: ApiMeta;
};

type AuthTokens = {
  access: string;
  refresh: string;
  user: User;
};

type MFAChallenge = {
  mfa_required: true;
  user_id: string;
};

export type LoginResponseData = AuthTokens | MFAChallenge;
export type LoginResponse = ApiResponse<LoginResponseData>;
export type RegisterResponse = ApiResponse<{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}>;
export type MFAVerifyResponse = ApiResponse<AuthTokens>;
export type ForgotPasswordResponse = ApiResponse<Record<string, never>>;
export type ProfileResponse = ApiResponse<User>;
