import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/components/ui";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";

/** Register page — creates a new account and navigates to email verification. */
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
      onSuccess: () => {
        navigate("/verify-email", { state: { email: form.email } });
      },
    });
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join Sansaar — the event universe">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {registerMutation.isError && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(registerMutation.error)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            value={form.first_name}
            onChange={set("first_name")}
            error={errors.first_name}
            placeholder="Kamal"
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            type="text"
            value={form.last_name}
            onChange={set("last_name")}
            error={errors.last_name}
            placeholder="Dhital"
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          hint="Must be at least 8 characters."
        />

        <Input
          label="Confirm password"
          type="password"
          value={form.confirm_password}
          onChange={set("confirm_password")}
          error={errors.confirm_password}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={registerMutation.isPending}
          className="w-full mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-[#6b6c75] mt-6 font-['Manrope']">
        Already have an account?{" "}
        <Link to="/login" className="text-[#121d3f] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
