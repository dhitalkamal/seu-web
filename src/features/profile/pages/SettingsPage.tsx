import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@/shared/components/ui";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";
import authApi from "@/features/auth/api/auth.api";
import AppLayout from "@/shared/layouts/AppLayout";

type Tab = "profile" | "security" | "mfa" | "sessions" | "gdpr";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "mfa", label: "Two-factor auth" },
  { id: "sessions", label: "Sessions" },
  { id: "gdpr", label: "Data & privacy" },
];

/** Full settings page with tabbed sections for profile, security, MFA, sessions, GDPR. */
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <AppLayout title="Settings" subtitle="Manage your account, security, and privacy.">
      <div style={{ maxWidth: 720 }}>
        {/* tab bar */}
        <div
          className="flex gap-1 overflow-x-auto mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 12, padding: 4 }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                border: "none",
                cursor: "pointer",
                transition: "all 150ms",
                background: tab === t.id ? "#050a26" : "transparent",
                color: tab === t.id ? "white" : "var(--on-var)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 14, padding: 32 }}>
          {tab === "profile" && <ProfileTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "mfa" && <MFATab />}
          {tab === "sessions" && <SessionsTab />}
          {tab === "gdpr" && <GDPRTab />}
        </div>
      </div>
    </AppLayout>
  );
}

// * Profile tab

function ProfileTab() {
  const qc = useQueryClient();
  const { user, setAuth } = useAuth();
  const { updateProfileMutation } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfileMutation.mutate(
      { first_name: firstName, last_name: lastName },
      {
        onSuccess: (res) => {
          const stored = { accessToken: "", refreshToken: "" };
          const raw = localStorage.getItem("sansaar-auth");
          if (raw) {
            const blob = JSON.parse(raw) as {
              state: { accessToken: string; refreshToken: string };
            };
            stored.accessToken = blob.state.accessToken;
            stored.refreshToken = blob.state.refreshToken;
          }
          setAuth(res.data, stored.accessToken, stored.refreshToken);
          qc.invalidateQueries({ queryKey: ["profile"] });
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionTitle>Personal information</SectionTitle>

      {saved && <SuccessBanner>Profile updated successfully.</SuccessBanner>}
      {updateProfileMutation.isError && (
        <ErrorBanner>{getApiError(updateProfileMutation.error)}</ErrorBanner>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <Input
        label="Email"
        value={user?.email ?? ""}
        disabled
        hint="Email cannot be changed here."
      />

      <div className="flex justify-end">
        <Button type="submit" loading={updateProfileMutation.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

// * Security tab

function SecurityTab() {
  const { changePasswordMutation } = useAuth();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saved, setSaved] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  function validate(): boolean {
    const next: Partial<typeof form> = {};
    if (!form.current_password) next.current_password = "Enter your current password.";
    if (form.new_password.length < 8) next.new_password = "Must be at least 8 characters.";
    if (form.new_password !== form.confirm_password)
      next.confirm_password = "Passwords do not match.";
    setErrors(next);
    return !Object.keys(next).length;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    changePasswordMutation.mutate(form, {
      onSuccess: () => {
        setForm({ current_password: "", new_password: "", confirm_password: "" });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionTitle>Change password</SectionTitle>
      <p className="text-sm text-[#6b6c75] font-['Manrope'] -mt-2">
        All active sessions will be signed out after a password change.
      </p>

      {saved && (
        <SuccessBanner>Password changed. All other sessions have been signed out.</SuccessBanner>
      )}
      {changePasswordMutation.isError && (
        <ErrorBanner>{getApiError(changePasswordMutation.error)}</ErrorBanner>
      )}

      <Input
        label="Current password"
        type="password"
        value={form.current_password}
        onChange={set("current_password")}
        error={errors.current_password}
      />
      <Input
        label="New password"
        type="password"
        value={form.new_password}
        onChange={set("new_password")}
        error={errors.new_password}
        hint="Cannot reuse any of your last 5 passwords."
      />
      <Input
        label="Confirm new password"
        type="password"
        value={form.confirm_password}
        onChange={set("confirm_password")}
        error={errors.confirm_password}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={changePasswordMutation.isPending}>
          Update password
        </Button>
      </div>
    </form>
  );
}

// * MFA tab

function MFATab() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [totp, setTotp] = useState("");
  const [totpError, setTotpError] = useState<string | undefined>();
  const [setupData, setSetupData] = useState<{ secret: string; provisioning_uri: string } | null>(
    null
  );
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const setupMutation = useMutation({
    mutationFn: () => authApi.setupMFA(),
    onSuccess: (res) => setSetupData(res.data),
  });

  const enableMutation = useMutation({
    mutationFn: (code: string) => authApi.enableMFA(code),
    onSuccess: (res) => {
      setBackupCodes(res.data.backup_codes);
      setSetupData(null);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (code: string) => authApi.disableMFA(code),
    onSuccess: () => {
      setTotp("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const { data: backupStatus } = useQuery({
    queryKey: ["backup-status"],
    queryFn: () => authApi.backupCodeStatus(),
    enabled: !!user?.mfa_enabled,
  });

  const regenMutation = useMutation({
    mutationFn: (code: string) => authApi.regenerateBackupCodes(code),
    onSuccess: (res) => {
      setBackupCodes(res.data.backup_codes);
      qc.invalidateQueries({ queryKey: ["backup-status"] });
    },
  });

  if (backupCodes.length > 0) {
    return (
      <div className="flex flex-col gap-5">
        <SectionTitle>Save your backup codes</SectionTitle>
        <SuccessBanner>
          MFA has been enabled. Save these codes — they are shown only once.
        </SuccessBanner>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((c) => (
            <code
              key={c}
              className="bg-[#f3f2ef] rounded-lg px-4 py-2 text-sm font-mono text-center text-[#19191e] tracking-widest"
            >
              {c}
            </code>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setBackupCodes([])}>Done</Button>
        </div>
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="flex flex-col gap-5">
        <SectionTitle>Scan QR code</SectionTitle>
        <p className="text-sm text-[#6b6c75] font-['Manrope']">
          Scan the QR code with your authenticator app, or enter the secret manually.
        </p>
        <div className="bg-[#f3f2ef] rounded-xl p-4 text-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(setupData.provisioning_uri)}&size=180x180`}
            alt="MFA QR code"
            className="mx-auto rounded-lg"
          />
        </div>
        <Input
          label="Secret key (manual entry)"
          value={setupData.secret}
          readOnly
          className="font-mono text-sm tracking-widest"
        />
        {enableMutation.isError && <ErrorBanner>{getApiError(enableMutation.error)}</ErrorBanner>}
        <Input
          label="Enter the 6-digit code to confirm"
          value={totp}
          onChange={(e) => setTotp(e.target.value)}
          error={totpError}
          maxLength={6}
          className="font-mono tracking-widest text-center"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setSetupData(null)}>
            Cancel
          </Button>
          <Button
            loading={enableMutation.isPending}
            onClick={() => {
              if (totp.length !== 6) {
                setTotpError("Enter the 6-digit code.");
                return;
              }
              setTotpError(undefined);
              enableMutation.mutate(totp);
            }}
          >
            Enable MFA
          </Button>
        </div>
      </div>
    );
  }

  if (user?.mfa_enabled) {
    return (
      <div className="flex flex-col gap-5">
        <SectionTitle>Two-factor authentication</SectionTitle>
        <div className="flex items-center gap-2 text-sm font-['Manrope']">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[#19191e] font-semibold">MFA is enabled</span>
        </div>
        <p className="text-sm text-[#6b6c75] font-['Manrope']">
          Backup codes remaining: <strong>{backupStatus?.data.remaining ?? "…"}</strong>
        </p>

        {disableMutation.isError && <ErrorBanner>{getApiError(disableMutation.error)}</ErrorBanner>}
        {regenMutation.isError && <ErrorBanner>{getApiError(regenMutation.error)}</ErrorBanner>}

        <Input
          label="TOTP code (to confirm actions below)"
          value={totp}
          onChange={(e) => setTotp(e.target.value)}
          maxLength={6}
          className="font-mono tracking-widest text-center w-40"
        />

        <div className="flex gap-3 flex-wrap">
          <Button
            variant="secondary"
            loading={regenMutation.isPending}
            onClick={() => regenMutation.mutate(totp)}
          >
            Regenerate backup codes
          </Button>
          <Button
            variant="danger"
            loading={disableMutation.isPending}
            onClick={() => disableMutation.mutate(totp)}
          >
            Disable MFA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Two-factor authentication</SectionTitle>
      <div className="flex items-center gap-2 text-sm font-['Manrope']">
        <span className="w-2 h-2 rounded-full bg-[#6b6c75]" />
        <span className="text-[#6b6c75]">MFA is not enabled</span>
      </div>
      <p className="text-sm text-[#6b6c75] font-['Manrope']">
        Add an extra layer of security. You will need an authenticator app such as Google
        Authenticator or Authy.
      </p>
      {setupMutation.isError && <ErrorBanner>{getApiError(setupMutation.error)}</ErrorBanner>}
      <div>
        <Button loading={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
          Set up MFA
        </Button>
      </div>
    </div>
  );
}

// * Sessions tab

function SessionsTab() {
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => authApi.listSessions(),
    select: (res) => res.data,
  });

  const revokeMutation = useMutation({
    mutationFn: (jti: string) => authApi.revokeSession(jti),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  if (isLoading) {
    return <p className="text-sm text-[#6b6c75] font-['Manrope']">Loading sessions…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Active sessions</SectionTitle>
      <p className="text-sm text-[#6b6c75] font-['Manrope'] -mt-2">
        These are the devices currently signed in to your account.
      </p>

      {revokeMutation.isError && <ErrorBanner>{getApiError(revokeMutation.error)}</ErrorBanner>}

      <div className="flex flex-col gap-3">
        {(sessions ?? []).map((session) => (
          <div
            key={session.jti}
            className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#e0dfd8] bg-[#fafaf8]"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold text-[#19191e] font-['Manrope'] truncate">
                {session.user_agent ?? "Unknown device"}
              </p>
              <p className="text-xs text-[#6b6c75] font-['Manrope']">
                {session.ip_address ?? "Unknown IP"} · Last active{" "}
                {new Date(session.last_seen_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={revokeMutation.isPending && revokeMutation.variables === session.jti}
              onClick={() => revokeMutation.mutate(session.jti)}
            >
              Revoke
            </Button>
          </div>
        ))}
        {(sessions ?? []).length === 0 && (
          <p className="text-sm text-[#6b6c75] font-['Manrope']">No active sessions found.</p>
        )}
      </div>
    </div>
  );
}

// * GDPR tab

function GDPRTab() {
  const navigate = useNavigate();
  const { deleteAccountMutation, user } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const erasureMutation = useMutation({
    mutationFn: (password?: string) => authApi.requestErasure(password),
    onSuccess: () => {
      deleteAccountMutation.mutate();
      navigate("/login", { state: { flash: "Your account data has been erased." } });
    },
  });

  function handleExportJSON() {
    authApi.exportDataJSON().then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sansaar-data-${user?.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handleExportCSV() {
    const blob = await authApi.exportDataCSV();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sansaar-data-${user?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isSocialUser = !user || user.email.includes("redacted");

  return (
    <div className="flex flex-col gap-8">
      {/* Export */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Export your data</SectionTitle>
        <p className="text-sm text-[#6b6c75] font-['Manrope'] -mt-2">
          Download a copy of all personal data Sansaar holds about you (GDPR Article 15).
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={handleExportJSON}>
            Export as JSON
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            Export as CSV
          </Button>
        </div>
      </div>

      {/* Erasure */}
      <div className="flex flex-col gap-4 pt-6 border-t border-[#e0dfd8]">
        <SectionTitle>Delete account</SectionTitle>
        <p className="text-sm text-[#6b6c75] font-['Manrope'] -mt-2">
          Permanently anonymises all your personal data (GDPR Article 17). This cannot be undone.
        </p>

        {erasureMutation.isError && <ErrorBanner>{getApiError(erasureMutation.error)}</ErrorBanner>}

        {!showDeleteConfirm ? (
          <div>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete my account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 rounded-xl bg-[#e83151]/5 border border-[#e83151]/20">
            <p className="text-sm font-semibold text-[#e83151] font-['Manrope']">
              Are you sure? This action is irreversible.
            </p>
            {!isSocialUser && (
              <Input
                label="Confirm with your current password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password to confirm"
              />
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={erasureMutation.isPending}
                onClick={() => erasureMutation.mutate(isSocialUser ? undefined : confirmPassword)}
              >
                Yes, delete my account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// * Shared micro-components

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-[#19191e] font-['Manrope']">{children}</h2>;
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-['Manrope']">
      {children}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
      {children}
    </div>
  );
}
