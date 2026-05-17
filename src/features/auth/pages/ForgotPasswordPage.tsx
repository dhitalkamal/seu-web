import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

/** Step 1 of 3 — enter email to receive the password-reset OTP. */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { requestPasswordResetMutation } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  function validate(): boolean {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError(undefined);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    requestPasswordResetMutation.mutate(
      { email },
      {
        onSuccess: () => {
          navigate("/forgot-password/verify", { state: { email } });
        },
      }
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a one-time code."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {requestPasswordResetMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(requestPasswordResetMutation.error)}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={requestPasswordResetMutation.isPending}
          className="w-full mt-2"
        >
          Send reset code
        </Button>
      </form>

      <p className="text-center text-sm text-[#6b6c75] mt-6 font-['Manrope']">
        <Link to="/login" className="text-[#121d3f] font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
