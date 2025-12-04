import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { userId?: string };

/** MFA challenge page — accepts a 6-digit TOTP code or 8-character backup code. */
export default function MFAVerifyPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const userId = state?.userId ?? "";

  const { mfaChallengeMutation, setAuth } = useAuth();

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();

  if (!userId) {
    return (
      <AuthLayout title="Session expired" subtitle="Please sign in again.">
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-[#121d3f] font-semibold hover:underline font-['Manrope'] text-sm"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  function validate(): boolean {
    const len = code.trim().length;
    if (len !== 6 && len !== 8) {
      setCodeError("Enter a 6-digit authenticator code or 8-character backup code.");
      return false;
    }
    setCodeError(undefined);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    mfaChallengeMutation.mutate(
      { user_id: userId, code: code.trim().toUpperCase() },
      {
        onSuccess: (res) => {
          const { access_token, refresh_token } = res.data;
          setAuth(
            {
              id: userId,
              email: "",
              first_name: "",
              last_name: "",
              avatar_url: null,
              is_email_verified: true,
              mfa_enabled: true,
              date_joined: new Date().toISOString(),
            },
            access_token,
            refresh_token
          );
          navigate("/");
        },
      }
    );
  }

  return (
    <AuthLayout
      title="Two-factor verification"
      subtitle="Enter the 6-digit code from your authenticator app, or a backup code."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mfaChallengeMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(mfaChallengeMutation.error)}
          </div>
        )}

        <Input
          label="Verification code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={codeError}
          placeholder="123456"
          maxLength={8}
          autoComplete="one-time-code"
          className="tracking-widest text-center font-mono text-lg"
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={mfaChallengeMutation.isPending}
          className="w-full mt-2"
        >
          Verify
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
