import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string };

const errorStyle = {
  background: "rgba(232,49,81,0.08)",
  color: "var(--secondary)",
  border: "1px solid rgba(232,49,81,0.2)",
  fontFamily: "Manrope, sans-serif",
};
const successStyle = {
  background: "#dcfce7",
  color: "#16a34a",
  border: "1px solid #bbf7d0",
  fontFamily: "Manrope, sans-serif",
};

/** Email verification — enter the 8-character OTP sent after registration. */
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
      <AuthLayout eyebrow="Verification" title="Check your" titleAccent="email">
        <p
          style={{
            fontSize: 13,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            marginBottom: 16,
          }}
        >
          We sent a verification code to your inbox.
        </p>
        <Link
          to="/register"
          className="font-bold no-underline hover:underline"
          style={{ color: "var(--primary)", fontSize: 13, fontFamily: "Manrope, sans-serif" }}
        >
          Back to sign up
        </Link>
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
        onSuccess: () =>
          navigate("/login", { state: { flash: "Email verified! You can now sign in." } }),
      }
    );
  }

  return (
    <AuthLayout
      eyebrow="Almost there"
      title="Verify your"
      titleAccent="email"
      subtitle={`Enter the 8-character code sent to ${email}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {verifyEmailMutation.isError && (
          <div className="px-4 py-3 rounded-xl text-sm" style={errorStyle}>
            {getApiError(verifyEmailMutation.error)}
          </div>
        )}
        {resent && (
          <div className="px-4 py-3 rounded-xl text-sm" style={successStyle}>
            A new code has been sent to {email}.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--on-mut)",
            }}
          >
            Verification code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.toUpperCase());
              setResent(false);
            }}
            placeholder="ABCD1234"
            maxLength={8}
            autoComplete="one-time-code"
            autoFocus
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              letterSpacing: "0.3em",
              padding: "11px 14px",
              textAlign: "center",
              border: otpError ? "1px solid var(--error)" : "1px solid var(--outline-strong)",
              borderRadius: 10,
              background: "white",
              outline: "none",
              textTransform: "uppercase",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = otpError
                ? "var(--error)"
                : "var(--outline-strong)";
            }}
          />
          {otpError && (
            <p style={{ fontSize: 12, color: "var(--error)", fontFamily: "Manrope, sans-serif" }}>
              {otpError}
            </p>
          )}
        </div>

        <SeuSubmitButton type="submit" loading={verifyEmailMutation.isPending} className="mt-2">
          Verify email
        </SeuSubmitButton>
      </form>

      <div
        className="flex flex-col items-center gap-2 mt-6"
        style={{ fontSize: 13, fontFamily: "Manrope, sans-serif" }}
      >
        <p style={{ color: "var(--on-var)" }}>
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={() => {
              resendOTPMutation.mutate(email, { onSuccess: () => setResent(true) });
            }}
            disabled={resendOTPMutation.isPending}
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: resendOTPMutation.isPending ? 0.5 : 1,
            }}
          >
            {resendOTPMutation.isPending ? "Sending…" : "Resend"}
          </button>
        </p>
        <Link
          to="/login"
          className="no-underline hover:underline"
          style={{ color: "var(--on-mut)" }}
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
