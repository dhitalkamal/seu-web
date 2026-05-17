import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuField, SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

/** Step 1 — enter email to receive the password-reset OTP. */
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
    requestPasswordResetMutation.mutate({ email }, {
      onSuccess: () => navigate("/forgot-password/verify", { state: { email } }),
    });
  }

  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your" titleAccent="password" subtitle="Enter your email and we'll send a one-time code.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {requestPasswordResetMutation.isError && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" }}>
            {getApiError(requestPasswordResetMutation.error)}
          </div>
        )}
        <SeuField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} placeholder="you@example.com" autoComplete="email" />
        <SeuSubmitButton type="submit" loading={requestPasswordResetMutation.isPending} className="mt-2">
          Send reset code
        </SeuSubmitButton>
      </form>
      <p className="text-center mt-6" style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
        <Link to="/login" className="font-bold no-underline hover:underline" style={{ color: "var(--primary)" }}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
