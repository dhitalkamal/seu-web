import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuDivider, SeuField, SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";
import authApi from "@/features/auth/api/auth.api";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { setRememberMe } from "@/shared/store/auth.store";
import type { LoginTokens } from "@/features/auth/types/auth.types";

type LocationState = { flash?: string };

/** Login page — SEU v8 glass modal design. */
export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const flash = state?.flash;

  const { loginMutation, setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setRememberMe(rememberMe);
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: async (res) => {
          const d = res.data;
          if (d.mfa_required) {
            navigate("/mfa", { state: { userId: d.user_id } });
          } else {
            const tokens = d as LoginTokens;
            // ! set tokens first so the axios interceptor can attach the Bearer header
            setAuth(
              {
                id: tokens.user_id,
                email,
                first_name: "",
                last_name: "",
                avatar_url: null,
                phone: null,
                bio: null,
                is_email_verified: true,
                mfa_enabled: false,
                date_joined: new Date().toISOString(),
              },
              tokens.access_token,
              tokens.refresh_token
            );
            // ! immediately fetch the full profile so we have real user data
            try {
              const profile = await authApi.getProfile();
              setAuth(profile.data, tokens.access_token, tokens.refresh_token);
            } catch {
              // non-fatal — useProfileBootstrap will retry on next page
            }
            navigate("/");
          }
        },
      }
    );
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in to" titleAccent="Sansaar">
      {flash && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "#dcfce7",
            color: "#16a34a",
            border: "1px solid #bbf7d0",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          {flash}
        </div>
      )}

      {/* SSO */}
      <div className="mb-5">
        <GoogleSignInButton onSuccess={() => navigate("/")} onError={() => loginMutation.reset()} />
      </div>

      <SeuDivider label="or continue with email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
        {loginMutation.isError && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(232,49,81,0.08)",
              color: "var(--secondary)",
              border: "1px solid rgba(232,49,81,0.2)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {getApiError(loginMutation.error)}
          </div>
        )}

        <SeuField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="flex flex-col gap-1">
          <SeuField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
            <label
              className="flex items-center gap-2 cursor-pointer"
              style={{ fontSize: 13, fontFamily: "Manrope, sans-serif", color: "var(--on-var)" }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                style={{ accentColor: "var(--primary)" }}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-xs no-underline hover:underline"
              style={{ color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <SeuSubmitButton type="submit" loading={loginMutation.isPending} className="mt-2">
          Sign in
        </SeuSubmitButton>
      </form>

      <p
        className="text-center mt-6"
        style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
      >
        No account?{" "}
        <Link
          to="/register"
          className="font-bold no-underline hover:underline"
          style={{ color: "var(--primary)" }}
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
