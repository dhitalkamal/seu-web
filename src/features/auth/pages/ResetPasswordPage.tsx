import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuField, SeuSubmitButton } from "@/shared/components/SeuField";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

type LocationState = { email?: string; otp?: string };

const errorStyle = {
  background: "rgba(232,49,81,0.08)",
  color: "var(--secondary)",
  border: "1px solid rgba(232,49,81,0.2)",
  fontFamily: "Manrope, sans-serif",
};

/** Step 3 — set a new password using the verified OTP. */
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
      <AuthLayout eyebrow="Session expired" title="Restart the" titleAccent="reset flow">
        <Link
          to="/forgot-password"
          className="font-bold no-underline hover:underline"
          style={{ color: "var(--primary)", fontSize: 13, fontFamily: "Manrope, sans-serif" }}
        >
          Restart password reset
        </Link>
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
        onSuccess: () =>
          navigate("/login", { state: { flash: "Password reset successfully. Please sign in." } }),
      }
    );
  }

  return (
    <AuthLayout
      eyebrow="Step 3 of 3"
      title="Set new"
      titleAccent="password"
      subtitle="Choose a strong password for your account."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {confirmPasswordResetMutation.isError && (
          <div className="px-4 py-3 rounded-xl text-sm" style={errorStyle}>
            {getApiError(confirmPasswordResetMutation.error)}
          </div>
        )}
        <SeuField
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />
        <SeuField
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          placeholder="Repeat your new password"
          autoComplete="new-password"
        />
        <SeuSubmitButton
          type="submit"
          loading={confirmPasswordResetMutation.isPending}
          className="mt-2"
        >
          Reset password
        </SeuSubmitButton>
      </form>
      <p
        className="text-center mt-6"
        style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
      >
        <Link
          to="/login"
          className="font-bold no-underline hover:underline"
          style={{ color: "var(--primary)" }}
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
