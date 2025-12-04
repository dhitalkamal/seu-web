import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string; otp?: string };

/** Step 3 of 3 — set a new password using the verified OTP. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const email = state?.email ?? "";
  const otp = state?.otp ?? "";

  const { confirmPasswordResetMutation } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  if (!email || !otp) {
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
    const next: typeof errors = {};
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    confirmPasswordResetMutation.mutate(
      { email, otp, new_password: password, confirm_password: confirm },
      {
        onSuccess: () => {
          navigate("/login", {
            state: { flash: "Password reset successfully. Please sign in." },
          });
        },
      }
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {confirmPasswordResetMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(confirmPasswordResetMutation.error)}
          </div>
        )}

        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          placeholder="Repeat your new password"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={confirmPasswordResetMutation.isPending}
          className="w-full mt-2"
        >
          Reset password
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
