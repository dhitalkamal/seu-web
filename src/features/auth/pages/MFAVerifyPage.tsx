import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { userId?: string };

const errorStyle = { background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" };

/** MFA challenge — accepts a 6-digit TOTP or 8-character backup code. */
export default function MFAVerifyPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const userId = state?.userId ?? "";
  const { mfaChallengeMutation, setAuth } = useAuth();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();

  if (!userId) {
    return (
      <AuthLayout eyebrow="Session expired" title="Sign in" titleAccent="again">
        <Link to="/login" className="font-bold no-underline hover:underline" style={{ color: "var(--primary)", fontSize: 13, fontFamily: "Manrope, sans-serif" }}>
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  function validate(): boolean {
    const len = code.trim().length;
    if (len !== 6 && len !== 8) { setCodeError("Enter a 6-digit authenticator code or 8-character backup code."); return false; }
    setCodeError(undefined); return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mfaChallengeMutation.mutate({ user_id: userId, code: code.trim().toUpperCase() }, {
      onSuccess: (res) => {
        const { access_token, refresh_token } = res.data;
        setAuth({ id: userId, email: "", first_name: "", last_name: "", avatar_url: null, is_email_verified: true, mfa_enabled: true, date_joined: new Date().toISOString() }, access_token, refresh_token);
        navigate("/");
      },
    });
  }

  return (
    <AuthLayout eyebrow="Two-factor auth" title="Verify your" titleAccent="identity" subtitle="Enter the 6-digit code from your authenticator app, or a backup code.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mfaChallengeMutation.isError && <div className="px-4 py-3 rounded-xl text-sm" style={errorStyle}>{getApiError(mfaChallengeMutation.error)}</div>}

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-mut)" }}>
            Verification code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={8}
            autoComplete="one-time-code"
            autoFocus
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, letterSpacing: "0.25em", padding: "11px 14px", textAlign: "center", border: codeError ? "1px solid var(--error)" : "1px solid var(--outline-strong)", borderRadius: 10, background: "white", outline: "none" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = codeError ? "var(--error)" : "var(--outline-strong)"; }}
          />
          {codeError && <p style={{ fontSize: 12, color: "var(--error)", fontFamily: "Manrope, sans-serif" }}>{codeError}</p>}
        </div>

        <SeuSubmitButton type="submit" loading={mfaChallengeMutation.isPending} className="mt-2">Verify</SeuSubmitButton>
      </form>
      <p className="text-center mt-6" style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
        <Link to="/login" className="font-bold no-underline hover:underline" style={{ color: "var(--primary)" }}>Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
