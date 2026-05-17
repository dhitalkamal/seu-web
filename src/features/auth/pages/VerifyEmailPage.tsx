import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string };

/** Email verification page — shown immediately after registration. */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const email = state?.email ?? "";

  const { verifyEmailMutation, resendOTPMutation } = useAuth();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [resent, setResent] = useState(false);

  if (!email) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a verification code to your inbox.">
        <div className="text-center mt-4">
          <Link
            to="/register"
            className="text-[#121d3f] font-semibold hover:underline text-sm font-['Manrope']"
          >
            Back to sign up
          </Link>
        </div>
      </AuthLayout>
    );
  }

  function validate(): boolean {
    if (otp.trim().length !== 8) {
      setOtpError("The code must be exactly 8 characters.");
      return false;
    }
    setOtpError(undefined);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    verifyEmailMutation.mutate(
      { email, otp: otp.trim().toUpperCase() },
      {
        onSuccess: () => {
          navigate("/login", { state: { flash: "Email verified! You can now sign in." } });
        },
      }
    );
  }

  function handleResend() {
    resendOTPMutation.mutate(email, {
      onSuccess: () => setResent(true),
    });
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 8-character code we sent to ${email}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {verifyEmailMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(verifyEmailMutation.error)}
          </div>
        )}

        {resent && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-['Manrope']">
            A new code has been sent to {email}.
          </div>
        )}

        <Input
          label="Verification code"
          type="text"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.toUpperCase());
            setResent(false);
          }}
          error={otpError}
          placeholder="ABCD1234"
          maxLength={8}
          autoComplete="one-time-code"
          className="tracking-widest text-center font-mono text-lg uppercase"
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={verifyEmailMutation.isPending}
          className="w-full mt-2"
        >
          Verify email
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 mt-6 text-sm font-['Manrope']">
        <p className="text-[#6b6c75]">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendOTPMutation.isPending}
            className="text-[#121d3f] font-semibold hover:underline disabled:opacity-50"
          >
            {resendOTPMutation.isPending ? "Sending…" : "Resend"}
          </button>
        </p>
        <Link to="/login" className="text-[#6b6c75] hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
