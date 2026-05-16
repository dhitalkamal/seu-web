import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { Button, Input } from "@/shared/components/ui";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

/** Login page -- handles both standard login and the MFA-required redirect. */
export default function LoginPage() {
  const navigate = useNavigate();
  const { loginMutation, setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
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
          if ("mfa_required" in d && d.mfa_required) {
            navigate("/mfa", { state: { userId: d.user_id } });
          } else if ("access" in d) {
            setAuth(d.user, d.access, d.refresh);
            navigate("/");
          }
        },
      }
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Sansaar account">
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

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8 text-xs text-[#6b6c75] hover:text-[#121d3f] font-['Manrope']"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-[#121d3f] hover:underline font-['Manrope']"
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

      <p className="text-center text-sm text-[#6b6c75] mt-6 font-['Manrope']">
        {"Don't have an account? "}
        <Link to="/register" className="text-[#121d3f] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
