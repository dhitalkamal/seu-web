import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import UserAvatar from "@/shared/components/UserAvatar";
import { useAuth, useSessions, getApiError } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/shared/store/auth.store";
import { useOrgStore, isOrgActive, isOrgPending, isOrgSuspended } from "@/shared/store/org.store";
import { usePreferencesStore } from "@/shared/store/preferences.store";
import { useOrgContext } from "@/features/orgs/hooks/useOrgContext"; // only used inside OrgTab
import notificationsApi from "@/features/notifications/api/notifications.api";
import type { Notification } from "@/features/notifications/api/notifications.api";
import paymentApi from "@/features/payment/api/payment.api";
import type { PaymentOrder } from "@/features/payment/types";
import authApi from "@/features/auth/api/auth.api";

// * ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "profile" | "org" | "billing" | "notifications" | "security" | "preferences";

type TabDef = { key: Tab; icon: string; label: string };

const TABS: TabDef[] = [
  { key: "profile", icon: "person", label: "Profile" },
  { key: "org", icon: "domain", label: "Organisation" },
  { key: "billing", icon: "credit_card", label: "Billing" },
  { key: "notifications", icon: "notifications", label: "Notifications" },
  { key: "security", icon: "shield", label: "Security" },
  { key: "preferences", icon: "tune", label: "Preferences" },
];

// * ─── Shared Styles ──────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  color: "var(--on-bg)",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Manrope', sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
};

// * ─── Main Component ─────────────────────────────────────────────────────────

/** Combined profile + settings page — sidebar with avatar card + vertical tabs. */
export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("profile");
  const user = useAuthStore((s) => s.user);

  const fullName = user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "User";
  const joinDate = user?.date_joined ? new Date(user.date_joined) : null;

  return (
    <AppLayout variant="user">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* left: sticky sidebar — top-aligned with hero card, sticks below topbar */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            position: "sticky",
            top: 84,
          }}
        >
          {/* tab navigation */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--mid)",
              borderRadius: 14,
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "none",
                    background: active ? "#050a26" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 120ms",
                  }}
                >
                  <MS n={t.icon} size={17} style={{ color: active ? "white" : "var(--on-mut)" }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? "white" : "var(--on-bg)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    {t.label}
                  </span>
                  {active && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--secondary)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* right: content panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "profile" && <ProfileTab fullName={fullName} joinDate={joinDate} />}
          {tab === "org" && <OrgTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "preferences" && <PreferencesTab />}
        </div>
      </div>
    </AppLayout>
  );
}

// * ─── Profile Tab ────────────────────────────────────────────────────────────

type ProfileTabProps = { fullName: string; joinDate: Date | null };

/** Profile tab — hero card, read-only personal info, "Edit Profile" opens a modal, quick stats, sessions. */
function ProfileTab({ fullName, joinDate }: ProfileTabProps) {
  const user = useAuthStore((s) => s.user);
  const { data: sessions } = useSessions();
  const [modalOpen, setModalOpen] = useState(false);

  // ! read-only field style — looks like plain text, not an input
  const readOnlyStyle: React.CSSProperties = {
    fontSize: 14,
    color: "var(--on-bg)",
    fontFamily: "Manrope, sans-serif",
    padding: "10px 0",
    lineHeight: 1.5,
  };

  return (
    <>
      {/* hero profile card */}
      <div
        style={{
          background: "linear-gradient(135deg, #050a26 0%, #121d3f 60%, #1a2a5e 100%)",
          borderRadius: 18,
          padding: "32px 32px 28px",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -10, top: -20, opacity: 0.04 }}>
          <span className="ms" style={{ fontSize: 160, color: "white" }}>
            account_circle
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
          <UserAvatar
            src={user?.avatar_url}
            uid={user?.id ?? ""}
            size={72}
            radius={18}
            style={{ border: "3px solid rgba(255,255,255,0.15)" }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: "-0.03em",
                color: "white",
                lineHeight: 1.15,
                marginBottom: 4,
              }}
            >
              {fullName}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              {user?.email}
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {user?.is_email_verified && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "rgba(34,197,94,0.15)",
                    color: "#86efac",
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  Verified
                </span>
              )}
              {user?.mfa_enabled && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "rgba(99,102,241,0.15)",
                    color: "#a5b4fc",
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  MFA On
                </span>
              )}
              {joinDate && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Joined {joinDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* quick stats row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}
      >
        <StatCard
          icon="devices"
          label="Active Sessions"
          value={String(sessions?.length ?? 0)}
          color="#6366f1"
        />
        <StatCard
          icon="verified_user"
          label="Security"
          value={user?.mfa_enabled ? "MFA On" : "Basic"}
          color={user?.mfa_enabled ? "#16a34a" : "#f59e0b"}
        />
        <StatCard
          icon="calendar_month"
          label="Member Since"
          value={
            joinDate
              ? joinDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "—"
          }
          color="#0ea5e9"
        />
      </div>

      {/* personal info — read-only, "Edit Profile" opens modal */}
      <SectionCard title="Personal Information" icon="badge">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <p style={readOnlyStyle}>{user?.first_name || "—"}</p>
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <p style={readOnlyStyle}>{user?.last_name || "—"}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <p style={readOnlyStyle}>{user?.email || "—"}</p>
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <p style={readOnlyStyle}>{user?.phone || "—"}</p>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Bio</label>
          <p style={{ ...readOnlyStyle, whiteSpace: "pre-wrap" }}>
            {user?.bio || "No bio added yet."}
          </p>
        </div>
        <div style={{ paddingTop: 4, display: "flex", justifyContent: "flex-end" }}>
          <Btn label="Edit Profile" onClick={() => setModalOpen(true)} icon="edit" primary />
        </div>
      </SectionCard>

      {/* active sessions */}
      <SectionCard title="Active Sessions" icon="devices" style={{ marginTop: 20 }}>
        <SessionsList />
      </SectionCard>

      {/* edit profile modal */}
      {modalOpen && <EditProfileModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

// * ─── Edit Profile Modal ─────────────────────────────────────────────────────

/** Full-screen overlay modal with form for all editable profile fields. */
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { updateProfileMutation } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  /** Persist changes and close modal on success. */
  async function handleSave() {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      });
      toast.success("Profile updated.");
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  /** Close on backdrop click. */
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // ! Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--mid)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MS n="edit" size={20} style={{ color: "var(--primary)" }} />
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
              }}
            >
              Edit Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
            }}
          >
            <MS n="close" size={20} style={{ color: "var(--on-mut)" }} />
          </button>
        </div>

        {/* modal body — all editable fields */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* avatar preview + url */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <UserAvatar
              src={avatarUrl}
              uid={user?.id ?? ""}
              size={56}
              radius={14}
              style={{ border: "2px solid var(--mid)" }}
            />
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Avatar URL</label>
              <input
                style={fieldStyle}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          {/* name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                style={fieldStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={fieldStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* email (read-only) + phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={{ ...fieldStyle, opacity: 0.55, cursor: "not-allowed" }}
                value={user?.email ?? ""}
                disabled
              />
              <p
                style={{
                  fontSize: 10.5,
                  color: "var(--on-mut)",
                  marginTop: 4,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Email cannot be changed.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                style={fieldStyle}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98..."
              />
            </div>
          </div>

          {/* bio */}
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself..."
            />
            <p
              style={{
                fontSize: 10.5,
                color: "var(--on-mut)",
                marginTop: 4,
                fontFamily: "Manrope, sans-serif",
                textAlign: "right",
              }}
            >
              {bio.length} / 500
            </p>
          </div>
        </div>

        {/* modal footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--outline)",
          }}
        >
          <Btn label="Cancel" onClick={onClose} />
          <Btn
            label={saving ? "Saving..." : "Save Changes"}
            onClick={handleSave}
            disabled={saving}
            primary
          />
        </div>
      </div>
    </div>
  );
}

/** Fetches and renders the user's active login sessions with revoke action. */
function SessionsList() {
  const { data: sessions, isLoading } = useSessions();

  if (isLoading) {
    return (
      <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
        Loading sessions...
      </p>
    );
  }
  if (!sessions || sessions.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
        No active sessions found.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sessions.map((s) => (
        <div
          key={s.jti}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: "var(--low)",
            borderRadius: 10,
          }}
        >
          <MS n="devices" size={18} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 12.5,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                fontWeight: 600,
              }}
            >
              {s.user_agent?.split("/")[0] ?? "Unknown device"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--on-mut)",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 2,
              }}
            >
              {s.ip_address ?? "—"} · Last seen {new Date(s.last_seen_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// * ─── Organisation Tab ───────────────────────────────────────────────────────

/** Organisation overview — create, view status, quick-edit. */
function OrgTab() {
  const navigate = useNavigate();
  useOrgContext();
  const org = useOrgStore((s) => s.org);

  if (!org) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--mid)",
          borderRadius: 16,
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--low)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          <MS n="domain_add" size={32} style={{ color: "var(--on-mut)" }} />
        </div>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--on-bg)",
            marginBottom: 8,
          }}
        >
          No organisation yet
        </p>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.55,
            maxWidth: 380,
            margin: "0 auto 28px",
          }}
        >
          Create an organisation to start hosting events and access the organiser dashboard.
        </p>
        <Btn label="Create Organisation" onClick={() => navigate("/org/new")} primary icon="add" />
      </div>
    );
  }

  return (
    <>
      {/* status banner */}
      {isOrgPending(org) && (
        <StatusBanner
          icon="hourglass_top"
          bg="rgba(245,158,11,0.08)"
          border="rgba(245,158,11,0.2)"
          color="#b45309"
          title="Pending Review"
          desc="Your organisation is being reviewed by our team."
        />
      )}
      {isOrgSuspended(org) && (
        <StatusBanner
          icon="block"
          bg="rgba(239,68,68,0.08)"
          border="rgba(239,68,68,0.2)"
          color="#dc2626"
          title="Suspended"
          desc="Your organisation has been suspended. Contact support."
        />
      )}
      {isOrgActive(org) && (
        <StatusBanner
          icon="check_circle"
          bg="rgba(34,197,94,0.08)"
          border="rgba(34,197,94,0.2)"
          color="#16a34a"
          title="Active"
          desc="Your organisation is verified and active."
        />
      )}

      <SectionCard title="Organisation Details" icon="domain" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {org.name?.[0]?.toUpperCase() ?? "O"}
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--on-bg)",
              }}
            >
              {org.name}
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--on-mut)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              @{org.slug}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 10 }}>
          {org.contact_email && <InfoRow icon="mail" label="Email" value={org.contact_email} />}
          {org.phone && <InfoRow icon="call" label="Phone" value={org.phone} />}
          {org.city && org.country && (
            <InfoRow icon="location_on" label="Location" value={`${org.city}, ${org.country}`} />
          )}
          <InfoRow
            icon="verified"
            label="Plan"
            value={org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--outline)",
          }}
        >
          <Btn label="Edit Details" icon="edit" onClick={() => navigate("/org/settings")} />
          {isOrgActive(org) && (
            <Btn
              label="Go to Dashboard"
              icon="space_dashboard"
              onClick={() => navigate("/dashboard")}
              primary
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}

// * ─── Billing Tab ───────────────────────────────────────────────────────────

/** Format a number as Nepali Rupees — e.g. Rs. 2,500 */
function formatNPR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

/** Map gateway to a Material Symbol icon name. */
function gatewayIcon(gw: string): string {
  const map: Record<string, string> = {
    khalti: "account_balance_wallet",
    esewa: "phone_android",
    stripe: "credit_card",
    paypal: "language",
  };
  return map[gw] ?? "payments";
}

/** Map order status to colour + icon. */
function statusStyle(status: string): { bg: string; color: string; icon: string } {
  switch (status) {
    case "completed":
      return { bg: "rgba(34,197,94,0.1)", color: "#16a34a", icon: "check_circle" };
    case "refunded":
      return { bg: "rgba(245,158,11,0.1)", color: "#b45309", icon: "undo" };
    case "failed":
      return { bg: "rgba(239,68,68,0.1)", color: "#dc2626", icon: "error" };
    case "cancelled":
      return { bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "cancel" };
    case "processing":
      return { bg: "rgba(99,102,241,0.1)", color: "#6366f1", icon: "hourglass_top" };
    default:
      return { bg: "var(--low)", color: "var(--on-mut)", icon: "pending" };
  }
}

/** Attendee billing — purchase history fetched from payment API, payment methods, invoices. */
function BillingTab() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "refunded">("all");

  // * Fetch orders on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await paymentApi.listMyOrders();
        if (!cancelled) setOrders(data);
      } catch {
        toast.error("Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // * Compute stats from real data
  const totalOrders = orders.length;
  const totalSpent = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0);
  const totalRefunded = orders
    .filter((o) => o.status === "refunded")
    .reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      {/* header with filter chips */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 4,
            }}
          >
            Billing & Purchases
          </h2>
          <p style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
            Your event registrations, payments, and invoices.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "completed", "refunded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px",
                borderRadius: 7,
                border: filter === f ? "none" : "1px solid var(--mid)",
                background: filter === f ? "#050a26" : "transparent",
                color: filter === f ? "white" : "var(--on-var)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* quick stats */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}
      >
        <StatCard
          icon="receipt_long"
          label="Total Orders"
          value={String(totalOrders)}
          color="#6366f1"
        />
        <StatCard
          icon="payments"
          label="Total Spent"
          value={formatNPR(totalSpent)}
          color="#16a34a"
        />
        <StatCard
          icon="currency_exchange"
          label="Refunded"
          value={formatNPR(totalRefunded)}
          color="#f59e0b"
        />
      </div>

      {/* transaction list */}
      <SectionCard title="Transaction History" icon="receipt_long">
        {loading ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--on-mut)",
              fontFamily: "Manrope, sans-serif",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            Loading orders...
          </p>
        ) : filtered.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--on-mut)",
              fontFamily: "Manrope, sans-serif",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            No transactions found for this filter.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((o) => {
              const ss = statusStyle(o.status);
              const amount = parseFloat(o.total_amount || "0");
              const dateStr = new Date(o.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const truncatedEventId =
                o.event_id.length > 12 ? o.event_id.slice(0, 12) + "..." : o.event_id;
              return (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--low)",
                    borderRadius: 10,
                  }}
                >
                  {/* gateway icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: ss.bg,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MS n={gatewayIcon(o.gateway)} size={18} style={{ color: ss.color }} />
                  </div>

                  {/* event + date + gateway */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "Manrope, sans-serif",
                        color: "var(--on-bg)",
                      }}
                    >
                      {truncatedEventId}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      {dateStr} · {o.gateway}
                    </p>
                  </div>

                  {/* amount + status badge */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: "var(--on-bg)",
                      }}
                    >
                      {formatNPR(amount)}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "Manrope, sans-serif",
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: ss.bg,
                        color: ss.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* payment methods */}
      <SectionCard title="Payment Methods" icon="account_balance_wallet" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--low)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MS n="credit_card" size={22} style={{ color: "var(--on-mut)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              No saved payment methods
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Payment methods are saved automatically when you purchase event tickets.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* invoices */}
      <SectionCard title="Invoices & Receipts" icon="description" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--low)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MS n="download" size={22} style={{ color: "var(--on-mut)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Download Invoices
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Invoices are generated for paid event registrations. Select a transaction above to
              download its receipt.
            </p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// * ─── Notifications Tab ──────────────────────────────────────────────────────

/** Full notification history + mark-read actions. */
function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      toast.error("Could not mark as read.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not mark all as read.");
    }
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function typeIcon(type: string): string {
    const map: Record<string, string> = {
      event_reminder: "event",
      registration_confirmed: "how_to_reg",
      payment_received: "payments",
      org_approved: "verified",
      org_suspended: "block",
      ticket_cancelled: "cancel",
      announcement: "campaign",
    };
    return map[type] ?? "notifications";
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 4,
            }}
          >
            Notifications
          </h2>
          <p style={{ fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
            {loading
              ? "Loading..."
              : `${notifications.length} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: "none",
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--primary)",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MS n="done_all" size={14} />
            Mark all read
          </button>
        )}
      </div>

      {!loading && notifications.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--mid)",
            borderRadius: 16,
            padding: "48px 28px",
            textAlign: "center",
          }}
        >
          <MS
            n="notifications_off"
            size={32}
            style={{
              color: "var(--on-mut)",
              opacity: 0.4,
              display: "block",
              margin: "0 auto 14px",
            }}
          />
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--on-bg)",
              marginBottom: 6,
            }}
          >
            No notifications yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              maxWidth: 360,
              margin: "0 auto",
            }}
          >
            Notifications about events, registrations, and your organisation will appear here.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                background: n.is_read ? "var(--surface)" : "rgba(99,102,241,0.04)",
                border: `1px solid ${n.is_read ? "var(--mid)" : "rgba(99,102,241,0.12)"}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: n.is_read ? "var(--low)" : "rgba(99,102,241,0.08)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <span
                  className="ms"
                  style={{ fontSize: 16, color: n.is_read ? "var(--on-mut)" : "var(--primary)" }}
                >
                  {typeIcon(n.notification_type)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: n.is_read ? 500 : 650,
                      color: "var(--on-bg)",
                      fontFamily: "Manrope, sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {n.message}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {timeAgo(n.created_at)}
                  </span>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--primary)",
                        cursor: "pointer",
                        fontFamily: "Manrope, sans-serif",
                        padding: 0,
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// * ─── Security Tab ───────────────────────────────────────────────────────────

/** Change password, MFA, sign out, danger zone — settings-list layout with modals. */
function SecurityTab() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { changePasswordMutation, deleteAccountMutation, logoutMutation } = useAuth();

  // * Modal visibility state
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);

  // * Change-password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  // * MFA setup state
  const [mfaStep, setMfaStep] = useState<"setup" | "verify" | "backup">("setup");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUri, setMfaUri] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);

  /** Kick off MFA setup — gets secret and provisioning URI from backend. */
  async function handleMfaSetup() {
    setMfaLoading(true);
    try {
      const res = await authApi.setupMFA();
      setMfaSecret(res.data.secret);
      setMfaUri(res.data.provisioning_uri);
      setMfaStep("verify");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setMfaLoading(false);
    }
  }

  /** Confirm TOTP code to enable MFA — returns backup codes on success. */
  async function handleMfaEnable() {
    if (!mfaCode.trim()) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setMfaLoading(true);
    try {
      const res = await authApi.enableMFA(mfaCode.trim());
      setMfaBackupCodes(res?.data?.backup_codes ?? []);
      setMfaStep("backup");
      // update local user state so badge flips to Active
      useAuthStore.setState((s) => ({ user: s.user ? { ...s.user, mfa_enabled: true } : s.user }));
      toast.success("Two-factor authentication enabled!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setMfaLoading(false);
    }
  }

  /** Disable MFA — asks for TOTP code first. */
  async function handleMfaDisable() {
    if (!mfaCode.trim()) {
      toast.error("Enter a TOTP code to confirm.");
      return;
    }
    setMfaLoading(true);
    try {
      await authApi.disableMFA(mfaCode.trim());
      useAuthStore.setState((s) => ({ user: s.user ? { ...s.user, mfa_enabled: false } : s.user }));
      toast.success("Two-factor authentication disabled.");
      closeMfaModal();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setMfaLoading(false);
    }
  }

  /** Reset MFA modal to initial state. */
  function closeMfaModal() {
    setMfaModalOpen(false);
    setMfaStep("setup");
    setMfaSecret("");
    setMfaUri("");
    setMfaCode("");
    setMfaBackupCodes([]);
  }

  /** Submit password change then close modal on success. */
  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("All fields are required.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      toast.success("Password changed.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwModalOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  /** Delete account and redirect to login. */
  async function handleDeleteAccount() {
    try {
      await deleteAccountMutation.mutateAsync();
      navigate("/login");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  /** Sign out and redirect to login. */
  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate("/login") });
  }

  return (
    <>
      {/* settings rows card */}
      <SectionCard title="Account Security" icon="shield">
        {/* Change Password row */}
        <SettingsRow
          icon="lock"
          title="Change Password"
          description="Update your account password regularly to keep your account secure."
          actionLabel="Change"
          onAction={() => setPwModalOpen(true)}
        />

        {/* Two-Factor Auth row — actionable */}
        <SettingsRow
          icon="security"
          title="Two-Factor Authentication"
          description={
            user?.mfa_enabled
              ? "Your account is protected with TOTP-based two-factor authentication."
              : "Add an extra layer of security with time-based one-time passwords."
          }
          actionLabel={user?.mfa_enabled ? "Disable" : "Enable"}
          onAction={() => {
            setMfaStep(user?.mfa_enabled ? "verify" : "setup");
            setMfaCode("");
            setMfaModalOpen(true);
          }}
          badge={user?.mfa_enabled ? "Active" : "Inactive"}
          badgeColor={user?.mfa_enabled ? "#16a34a" : "#b45309"}
          badgeBg={user?.mfa_enabled ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)"}
        />

        {/* Sign Out row */}
        <SettingsRow
          icon="logout"
          title="Sign Out"
          description="Sign out of your account on this device."
          actionLabel="Sign Out"
          onAction={() => setLogoutModalOpen(true)}
        />
      </SectionCard>

      {/* danger zone */}
      <div
        style={{
          marginTop: 20,
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MS n="warning" size={18} style={{ color: "#ef4444" }} />
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "#dc2626",
            }}
          >
            Danger Zone
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.55,
              }}
            >
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "transparent",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwModalOpen && (
        <SecurityModal
          title="Change Password"
          icon="lock"
          onClose={() => {
            setPwModalOpen(false);
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
          }}
          footer={
            <>
              <Btn
                label="Cancel"
                onClick={() => {
                  setPwModalOpen(false);
                  setCurrentPw("");
                  setNewPw("");
                  setConfirmPw("");
                }}
              />
              <Btn
                label={saving ? "Updating..." : "Update Password"}
                onClick={handleChangePassword}
                disabled={saving}
                primary
              />
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                style={fieldStyle}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                style={fieldStyle}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                style={fieldStyle}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
          </div>
        </SecurityModal>
      )}

      {/* Sign Out Confirmation Modal */}
      {logoutModalOpen && (
        <SecurityModal
          title="Sign Out"
          icon="logout"
          onClose={() => setLogoutModalOpen(false)}
          footer={
            <>
              <Btn label="Cancel" onClick={() => setLogoutModalOpen(false)} />
              <Btn label="Sign Out" onClick={handleLogout} primary />
            </>
          }
        >
          <p
            style={{
              fontSize: 14,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to sign out? You will need to log in again to access your account.
          </p>
        </SecurityModal>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <SecurityModal
          title="Delete Account"
          icon="warning"
          onClose={() => setDeleteModalOpen(false)}
          footer={
            <>
              <Btn label="Cancel" onClick={() => setDeleteModalOpen(false)} />
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MS n="delete_forever" size={15} />
                Yes, Delete Permanently
              </button>
            </>
          }
        >
          <p
            style={{
              fontSize: 14,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.6,
            }}
          >
            Are you sure? This will permanently delete your account and all associated data. This
            action cannot be undone.
          </p>
        </SecurityModal>
      )}

      {/* MFA setup / disable modal */}
      {mfaModalOpen && (
        <SecurityModal
          title={user?.mfa_enabled ? "Disable Two-Factor Auth" : "Enable Two-Factor Auth"}
          icon="security"
          onClose={closeMfaModal}
          footer={
            mfaStep === "backup" ? (
              <Btn label="Done" onClick={closeMfaModal} />
            ) : mfaStep === "setup" ? (
              <>
                <Btn label="Cancel" onClick={closeMfaModal} />
                <button
                  onClick={handleMfaSetup}
                  disabled={mfaLoading}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 9,
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    opacity: mfaLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="qr_code_2" size={15} />
                  {mfaLoading ? "Setting up…" : "Get QR Code"}
                </button>
              </>
            ) : user?.mfa_enabled ? (
              <>
                <Btn label="Cancel" onClick={closeMfaModal} />
                <button
                  onClick={handleMfaDisable}
                  disabled={mfaLoading}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 9,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    opacity: mfaLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="shield" size={15} />
                  {mfaLoading ? "Disabling…" : "Disable MFA"}
                </button>
              </>
            ) : (
              <>
                <Btn label="Cancel" onClick={closeMfaModal} />
                <button
                  onClick={handleMfaEnable}
                  disabled={mfaLoading}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 9,
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    opacity: mfaLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="verified_user" size={15} />
                  {mfaLoading ? "Verifying…" : "Verify & Enable"}
                </button>
              </>
            )
          }
        >
          {/* Step 1: intro */}
          {mfaStep === "setup" && (
            <p
              style={{
                fontSize: 14,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.6,
              }}
            >
              Two-factor authentication adds an extra layer of security by requiring a time-based
              code from your authenticator app (Google Authenticator, Authy, etc.) every time you
              sign in. Click <strong>Get QR Code</strong> to begin setup.
            </p>
          )}

          {/* Step 2: show QR / secret + code input (also used for disable) */}
          {mfaStep === "verify" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* QR code — only shown when enabling */}
              {!user?.mfa_enabled && mfaUri && (
                <>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    Scan this QR code with your authenticator app, then enter the 6-digit code
                    below.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaUri)}`}
                      alt="MFA QR Code"
                      style={{
                        width: 180,
                        height: 180,
                        borderRadius: 12,
                        border: "1px solid var(--outline)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      background: "var(--low)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                        marginBottom: 4,
                      }}
                    >
                      Or enter this secret manually:
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'Space Grotesk', monospace",
                        color: "var(--on-bg)",
                        letterSpacing: 1.5,
                        wordBreak: "break-all",
                      }}
                    >
                      {mfaSecret}
                    </p>
                  </div>
                </>
              )}

              {/* Disable prompt */}
              {user?.mfa_enabled && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  Enter a 6-digit code from your authenticator app to confirm disabling two-factor
                  authentication.
                </p>
              )}

              {/* TOTP code input */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Verification Code
                </label>
                <input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  maxLength={8}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--outline)",
                    background: "var(--surface)",
                    fontSize: 16,
                    fontFamily: "'Space Grotesk', monospace",
                    color: "var(--on-bg)",
                    textAlign: "center",
                    letterSpacing: 6,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: backup codes */}
          {mfaStep === "backup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--on-var)",
                  fontFamily: "Manrope, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                MFA is now active. Save these one-time backup codes somewhere safe — you can use
                them if you lose access to your authenticator app.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  background: "var(--low)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                {mfaBackupCodes.map((code) => (
                  <span
                    key={code}
                    style={{
                      fontFamily: "'Space Grotesk', monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--on-bg)",
                      textAlign: "center",
                      padding: "6px 8px",
                      background: "var(--surface)",
                      borderRadius: 8,
                      border: "1px solid var(--outline)",
                    }}
                  >
                    {code}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontSize: 11.5,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  fontStyle: "italic",
                }}
              >
                Each code can only be used once. Store them in a password manager.
              </p>
            </div>
          )}
        </SecurityModal>
      )}
    </>
  );
}

/** A single row in the security settings list — icon, title, description, action button on the right. */
function SettingsRow({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  badge,
  badgeColor,
  badgeBg,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderTop: "1px solid var(--outline)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--low)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <MS n={icon} size={20} style={{ color: "var(--on-mut)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "Manrope, sans-serif",
            color: "var(--on-bg)",
            marginBottom: 2,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      </div>
      {badge && (
        <span
          style={{
            padding: "4px 12px",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "Manrope, sans-serif",
            background: badgeBg ?? "var(--low)",
            color: badgeColor ?? "var(--on-var)",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
      <Btn label={actionLabel} onClick={onAction} />
    </div>
  );
}

/** Reusable modal shell matching the EditProfileModal pattern — fixed overlay, centered card, header/body/footer. */
function SecurityModal({
  title,
  icon,
  onClose,
  children,
  footer,
}: {
  title: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  /** Close on backdrop click. */
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // ! Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--mid)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MS n={icon} size={20} style={{ color: "var(--primary)" }} />
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
            }}
          >
            <MS n="close" size={20} style={{ color: "var(--on-mut)" }} />
          </button>
        </div>

        {/* modal body */}
        <div style={{ padding: "20px 24px" }}>{children}</div>

        {/* modal footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--outline)",
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

// * ─── Preferences Tab ────────────────────────────────────────────────────────

/** User preferences — volunteer mode toggle, theme, notification prefs. */
function PreferencesTab() {
  const { volunteerEnabled, setVolunteerEnabled } = usePreferencesStore();

  return (
    <>
      <SectionCard title="Volunteer Mode" icon="volunteer_activism">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: volunteerEnabled ? "rgba(99,102,241,0.1)" : "var(--low)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MS
              n="volunteer_activism"
              size={22}
              style={{ color: volunteerEnabled ? "#4338ca" : "var(--on-mut)" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Volunteer Dashboard
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Enable the volunteer dashboard to browse roles, apply for shifts, track hours, and
              earn certificates. When enabled, you can switch to the volunteer view from the navbar.
            </p>
          </div>
          {/* toggle switch */}
          <button
            onClick={() => setVolunteerEnabled(!volunteerEnabled)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: "none",
              background: volunteerEnabled ? "#4338ca" : "var(--mid)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              transition: "background 200ms",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                background: "white",
                position: "absolute",
                top: 3,
                left: volunteerEnabled ? 25 : 3,
                transition: "left 200ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Appearance" icon="palette" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--low)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MS n="light_mode" size={22} style={{ color: "var(--on-mut)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Theme
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Choose your preferred appearance. System follows your OS setting.
            </p>
          </div>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Manrope, sans-serif",
              background: "var(--low)",
              color: "var(--on-var)",
            }}
          >
            Light
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Notification Preferences"
        icon="notifications_active"
        style={{ marginTop: 20 }}
      >
        {[
          {
            key: "events",
            label: "Event Reminders",
            desc: "Get notified before events you've registered for",
            enabled: true,
          },
          {
            key: "org",
            label: "Organisation Updates",
            desc: "Status changes, approvals, and team notifications",
            enabled: true,
          },
          {
            key: "marketing",
            label: "Marketing & Recommendations",
            desc: "Event suggestions and platform announcements",
            enabled: false,
          },
        ].map((pref) => (
          <div
            key={pref.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 0",
              borderBottom: "1px solid var(--outline)",
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  color: "var(--on-bg)",
                  marginBottom: 2,
                }}
              >
                {pref.label}
              </p>
              <p
                style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                {pref.desc}
              </p>
            </div>
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: pref.enabled ? "#4338ca" : "var(--mid)",
                position: "relative",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left: pref.enabled ? 21 : 3,
                  transition: "left 200ms",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Data & Privacy" icon="privacy_tip" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--low)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MS n="download" size={22} style={{ color: "var(--on-mut)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Export My Data
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Download a copy of your account data including registrations, profile info, and
              activity history.
            </p>
          </div>
          <Btn
            label="Request Export"
            icon="download"
            onClick={() => toast.success("Data export requested. You'll receive an email.")}
          />
        </div>
      </SectionCard>
    </>
  );
}

// * ─── Shared UI ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  style,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--mid)",
        borderRadius: 16,
        padding: 24,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <MS n={icon} size={18} style={{ color: "var(--on-mut)" }} />
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.02em",
            color: "var(--on-bg)",
          }}
        >
          {title}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function Btn({
  label,
  onClick,
  primary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 20px",
        borderRadius: 9,
        border: primary ? "none" : "1px solid var(--mid)",
        background: primary ? "var(--primary)" : "transparent",
        color: primary ? "#fff" : "var(--on-var)",
        fontSize: 13,
        fontWeight: primary ? 700 : 600,
        fontFamily: "Manrope, sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon && <MS n={icon} size={15} />}
      {label}
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <MS n={icon} size={16} style={{ color: "var(--on-mut)", marginTop: 2, flexShrink: 0 }} />
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--on-mut)",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--on-bg)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.45,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/** Compact stat card — flat design, no icon backgrounds for consistency. */
function StatCard({
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--mid)",
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "var(--on-mut)",
          fontFamily: "Manrope, sans-serif",
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          color,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBanner({
  icon,
  bg,
  border,
  color,
  title,
  desc,
}: {
  icon: string;
  bg: string;
  border: string;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
      }}
    >
      <MS n={icon} size={20} style={{ color }} />
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color, fontFamily: "Manrope, sans-serif" }}>
          {title}
        </p>
        <p
          style={{
            fontSize: 12.5,
            color,
            opacity: 0.85,
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.45,
            marginTop: 2,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}
