import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { SeuDivider, SeuField, SeuSubmitButton } from "@/shared/components/SeuField";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

/** Register page — SEU v8 glass modal design. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerMutation } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validate(): boolean {
    const next: Partial<typeof form> = {};
    if (!form.first_name.trim()) next.first_name = "First name is required.";
    if (!form.last_name.trim()) next.last_name = "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm_password) next.confirm_password = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate(form, {
      onSuccess: () => navigate("/verify-email", { state: { email: form.email } }),
    });
  }

  return (
    <AuthLayout eyebrow="Join the universe" title="Create your" titleAccent="account">
      {/* SSO */}
      <div className="mb-5">
        <GoogleSignInButton
          onSuccess={(isNew) => navigate("/", isNew ? undefined : { state: { flash: "Welcome back!" } })}
          onError={() => {}}
        />
      </div>

      <SeuDivider label="or register with email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
        {registerMutation.isError && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" }}
          >
            {getApiError(registerMutation.error)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <SeuField label="First name" type="text" value={form.first_name} onChange={set("first_name")} error={errors.first_name} placeholder="Kamal" autoComplete="given-name" />
          <SeuField label="Last name" type="text" value={form.last_name} onChange={set("last_name")} error={errors.last_name} placeholder="Dhital" autoComplete="family-name" />
        </div>

        <SeuField label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@example.com" autoComplete="email" />
        <SeuField label="Password" type="password" value={form.password} onChange={set("password")} error={errors.password} placeholder="Min. 8 characters" autoComplete="new-password" />
        <SeuField label="Confirm password" type="password" value={form.confirm_password} onChange={set("confirm_password")} error={errors.confirm_password} placeholder="Repeat password" autoComplete="new-password" />

        <SeuSubmitButton type="submit" loading={registerMutation.isPending} className="mt-2">
          Create account
        </SeuSubmitButton>
      </form>

      <p className="text-center mt-6" style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-bold no-underline hover:underline" style={{ color: "var(--primary)" }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
