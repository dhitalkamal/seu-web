import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { Button, Input } from "@/shared/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

/** Forgot password page -- always shows success to prevent email enumeration. */
export default function ForgotPasswordPage() {
  const { forgotPasswordMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError(undefined);
    forgotPasswordMutation.mutate({ email }, { onSuccess: () => setSent(true) });
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="A reset link is on its way">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-[#dba13d]/15 flex items-center justify-center text-3xl">
            ✉
          </div>
          <p className="text-sm text-center text-[#45464e] font-['Manrope']">
            If <span className="font-semibold text-[#19191e]">{email}</span> is registered, we sent
            a password reset link.
          </p>
          <Link
            to="/login"
            className="text-sm text-[#121d3f] font-semibold hover:underline font-['Manrope']"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send a reset link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
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
          loading={forgotPasswordMutation.isPending}
          className="w-full mt-2"
        >
          Send reset link
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
