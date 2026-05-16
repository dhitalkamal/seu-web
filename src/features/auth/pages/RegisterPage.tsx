import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { Button, Input } from "@/shared/components/ui";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";
import { cn } from "@/shared/lib/cn";

type Role = "attendee" | "organiser";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

/** Registration page with role selector (Attendee / Organiser). */
export default function RegisterPage() {
  const { registerMutation } = useAuth();

  const [role, setRole] = useState<Role>("attendee");
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Partial<FormState & { server: string }>>({});
  const [registered, setRegistered] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.first_name.trim()) next.first_name = "First name is required";
    if (!form.last_name.trim()) next.last_name = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8) next.password = "At least 8 characters required";
    if (form.confirm_password !== form.password) next.confirm_password = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    registerMutation.mutate(
      {
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      },
      {
        onSuccess: () => setRegistered(true),
        onError: (err) => setErrors((prev) => ({ ...prev, server: getApiError(err) })),
      }
    );
  }

  if (registered) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Verify your email to get started">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-[#dba13d]/15 flex items-center justify-center text-3xl">
            ✉
          </div>
          <p className="text-sm text-center text-[#45464e] font-['Manrope']">
            We sent a verification link to{" "}
            <span className="font-semibold text-[#19191e]">{form.email}</span>. Check your inbox.
          </p>
          <Link
            to="/login"
            className="text-sm text-[#121d3f] font-semibold hover:underline font-['Manrope']"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the Sansaar platform">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Role toggle */}
        <div className="flex rounded-xl border border-[#121d3f]/20 p-1 gap-1">
          {(["attendee", "organiser"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors font-['Manrope']",
                role === r ? "bg-[#121d3f] text-white" : "text-[#45464e] hover:bg-[#f4f5f7]"
              )}
            >
              {r === "attendee" ? "Attendee" : "Organiser"}
            </button>
          ))}
        </div>

        {errors.server && (
          <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {errors.server}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            error={errors.first_name}
            placeholder="Kamal"
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            error={errors.last_name}
            placeholder="Dhital"
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
          placeholder="••••••••"
          hint="Minimum 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          value={form.confirm_password}
          onChange={(e) => set("confirm_password", e.target.value)}
          error={errors.confirm_password}
          placeholder="••••••••"
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
        {"Already have an account? "}
        <Link to="/login" className="text-[#121d3f] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
