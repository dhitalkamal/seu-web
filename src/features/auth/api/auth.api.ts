import client from "@/shared/api/client";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MFAChallengeRequest,
  MFAVerifyResponse,
  ProfileResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/features/auth/types/auth.types";

const AUTH = "/iam/api/v1/auth";
const PROFILE = "/iam/api/v1/profile";

/** Registers a new user account. Returns the created user's basic profile. */
async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const res = await client.post<RegisterResponse>(`${AUTH}/register/`, payload);
  return res.data;
}

/** Logs in with email and password. Returns full auth tokens or an MFA challenge signal. */
async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>(`${AUTH}/login/`, payload);
  return res.data;
}

/** Invalidates the refresh token on the server side. Call before clearing local session. */
async function logout(refreshToken: string): Promise<void> {
  await client.post(`${AUTH}/logout/`, { refresh_token: refreshToken });
}

/** Submits the 6-digit TOTP code to complete an MFA login challenge. */
async function verifyMFA(payload: MFAChallengeRequest): Promise<MFAVerifyResponse> {
  const res = await client.post<MFAVerifyResponse>(`${AUTH}/mfa/challenge/`, payload);
  return res.data;
}

/** Requests a password reset email. Always returns success to prevent email enumeration. */
async function forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const res = await client.post<ForgotPasswordResponse>(`${AUTH}/password/forgot/`, payload);
  return res.data;
}

/** Fetches the authenticated user's full profile. */
async function getProfile(): Promise<ProfileResponse> {
  const res = await client.get<ProfileResponse>(`${PROFILE}/me/`);
  return res.data;
}

const authApi = { register, login, logout, verifyMFA, forgotPassword, getProfile };
export default authApi;
