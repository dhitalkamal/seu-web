import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string };

const errorStyle = { background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" };

/** Step 2 — enter the 8-character OTP received by email. */
export default function VerifyResetOTPPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const email = state?.email ?? "";
  const { verifyPasswordResetOTPMutation } = useAuth();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();

  if (!email) {
    return (
      <AuthLayout eyebrow="Session expired" title="Restart the" titleAccent="reset flow">
        <Link to="/forgot-password" className="font-bold no-underline hover:underline" style={{ color: "var(--primary)", fontSize: 13, fontFamily: "Manrope, sans-serif" }}>
          Restart password reset
        </Link>
      </AuthLayout>
    );
  }

  function validate(): boolean {
    if (otp.trim().length !== 8) { setOtpError("The code must be exactly 8 characters."); return false; }
    setOtpError(undefined); return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    verifyPasswordResetOTPMutation.mutate({ email, otp: otp.trim().toUpperCase() }, {
      onSuccess: () => navigate("/forgot-password/reset", { state: { email, otp: otp.trim().toUpperCase() } }),
    });
  }

  return (
    <AuthLayout eyebrow="Step 2 of 3" title="Enter your" titleAccent="code" subtitle={`We sent an 8-character code to ${email}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {verifyPasswordResetOTPMutation.isError && <div className="px-4 py-3 rounded-xl text-sm" style={errorStyle}>{getApiError(verifyPasswordResetOTPMutation.error)}</div>}

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-mut)" }}>
            Reset code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            maxLength={8}
            autoComplete="one-time-code"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, letterSpacing: "0.3em", padding: "11px 14px", textAlign: "center", border: otpError ? "1px solid var(--error)" : "1px solid var(--outline-strong)", borderRadius: 10, background: "white", outline: "none", textTransform: "uppercase" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = otpError ? "var(--error)" : "var(--outline-strong)"; }}
          />
          {otpError && <p style={{ fontSize: 12, color: "var(--error)", fontFamily: "Manrope, sans-serif" }}>{otpError}</p>}
        </div>

        <SeuSubmitButton type="submit" loading={verifyPasswordResetOTPMutation.isPending} className="mt-2">Verify code</SeuSubmitButton>
      </form>

      <div className="flex flex-col items-center gap-2 mt-6" style={{ fontSize: 13, fontFamily: "Manrope, sans-serif" }}>
        <p style={{ color: "var(--on-var)" }}>
          Didn't receive it?{" "}
          <Link to="/forgot-password" state={{ email }} className="font-bold no-underline hover:underline" style={{ color: "var(--primary)" }}>Resend</Link>
        </p>
        <Link to="/login" className="no-underline hover:underline" style={{ color: "var(--on-mut)" }}>Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
