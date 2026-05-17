import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string };

/** Step 2 of 3 — enter the 8-character OTP received by email. */
export default function VerifyResetOTPPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const email = state?.email ?? "";

  const { verifyPasswordResetOTPMutation } = useAuth();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();

  /** Redirect back to step 1 if email is missing from router state. */
  if (!email) {
    return (
      <AuthLayout title="Session expired" subtitle="Please start the reset flow again.">
        <div className="text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-[#121d3f] font-semibold hover:underline font-['Manrope'] text-sm"
          >
            Restart password reset
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

    verifyPasswordResetOTPMutation.mutate(
      { email, otp: otp.trim().toUpperCase() },
      {
        onSuccess: () => {
          navigate("/forgot-password/reset", {
            state: { email, otp: otp.trim().toUpperCase() },
          });
        },
      }
    );
  }

  return (
    <AuthLayout title="Enter your code" subtitle={`We sent an 8-character code to ${email}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {verifyPasswordResetOTPMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(verifyPasswordResetOTPMutation.error)}
          </div>
        )}

        <Input
          label="Reset code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.toUpperCase())}
          error={otpError}
          placeholder="ABCD1234"
          maxLength={8}
          autoComplete="one-time-code"
          className="tracking-widest text-center font-mono text-lg uppercase"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={verifyPasswordResetOTPMutation.isPending}
          className="w-full mt-2"
        >
          Verify code
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 mt-6 text-sm font-['Manrope']">
        <p className="text-[#6b6c75]">
          Didn&apos;t receive the code?{" "}
          <Link
            to="/forgot-password"
            state={{ email }}
            className="text-[#121d3f] font-semibold hover:underline"
          >
            Resend
          </Link>
        </p>
        <Link to="/login" className="text-[#6b6c75] hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
