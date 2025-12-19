import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import type { LoginTokens } from "@/features/auth/types/auth.types";

type LocationState = { flash?: string };

/** Login page — handles standard login and redirects to MFA challenge when needed. */
export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const flash = state?.flash;

  const { loginMutation, setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          const d = res.data;
          if (d.mfa_required) {
            navigate("/mfa", { state: { userId: d.user_id } });
          } else {
            const tokens = d as LoginTokens;
            setAuth(
              {
                id: tokens.user_id,
                email,
                first_name: "",
                last_name: "",
                avatar_url: null,
                is_email_verified: true,
                mfa_enabled: false,
                date_joined: new Date().toISOString(),
              },
              tokens.access_token,
              tokens.refresh_token
            );
            navigate("/");
          }
        },
      }
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Sansaar account">
      {flash && (
        <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-['Manrope']">
          {flash}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {loginMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(loginMutation.error)}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Link
            to="/forgot-password"
            className="text-xs text-[#6b6c75] hover:text-[#121d3f] font-['Manrope'] self-end"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loginMutation.isPending}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <hr className="flex-1 border-[#e0dfd8]" />
        <span className="text-xs text-[#9b9ca4] font-['Manrope']">or</span>
        <hr className="flex-1 border-[#e0dfd8]" />
      </div>

      <GoogleSignInButton
        onSuccess={() => navigate("/")}
        onError={() => loginMutation.reset()}
      />

      <p className="text-center text-sm text-[#6b6c75] mt-6 font-['Manrope']">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-[#121d3f] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
