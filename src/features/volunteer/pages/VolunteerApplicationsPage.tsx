import { useState } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";

// * ─── Types ──────────────────────────────────────────────────────────────────

type ApplicationStatus = "open" | "applied" | "accepted" | "rejected";

/** Open volunteer role — listed for users to browse and apply. */
type VolunteerRole = {
  id: string;
  event_name: string;
  role_title: string;
  description: string;
  event_date: string;
  venue: string;
  slots_available: number;
  slots_total: number;
  status: ApplicationStatus;
  skills: string[];
};

type Tab = "browse" | "applied" | "accepted" | "rejected";

// TODO: replace with real API hook
/** Placeholder — no roles until API is connected. */
const ROLES: VolunteerRole[] = [];

// * ─── Component ──────────────────────────────────────────────────────────────

/** Browse open volunteer roles and manage applications. */
export default function VolunteerApplicationsPage() {
  const [tab, setTab] = useState<Tab>("browse");

  const filtered =
    tab === "browse"
      ? ROLES.filter((r) => r.status === "open")
      : ROLES.filter((r) => r.status === tab);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "browse", label: "Browse Roles", icon: "search" },
    { key: "applied", label: "Applied", icon: "send" },
    { key: "accepted", label: "Accepted", icon: "check_circle" },
    { key: "rejected", label: "Rejected", icon: "cancel" },
  ];

  return (
    <AppLayout
      variant="volunteer"
      title="Volunteer Applications"
      subtitle="Browse open roles and track your application status."
      crumbs={["Volunteer", "Applications"]}
    >
      {/* tab bar */}
      <div
        className="flex gap-1 mb-6"
        style={{ background: "var(--low)", borderRadius: 10, padding: 3, width: "fit-content" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: tab === t.key ? "#050a26" : "transparent",
              color: tab === t.key ? "white" : "var(--on-var)",
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 500,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MS n={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "56px 28px",
            textAlign: "center",
          }}
        >
          <span
            className="ms"
            style={{
              fontSize: 40,
              color: "var(--on-mut)",
              opacity: 0.4,
              display: "block",
              marginBottom: 14,
            }}
          >
            {tab === "browse"
              ? "assignment"
              : tab === "applied"
                ? "hourglass_top"
                : tab === "accepted"
                  ? "check_circle"
                  : "cancel"}
          </span>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 8,
            }}
          >
            {tab === "browse" ? "No open roles right now" : `No ${tab} applications`}
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.55,
              maxWidth: 400,
              margin: "0 auto",
            }}
          >
            {tab === "browse"
              ? "Check back later — organisers post new volunteer roles as events approach."
              : `Your ${tab} applications will appear here once you start applying for roles.`}
          </p>
        </div>
      )}

      {/* role cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((role) => (
            <div
              key={role.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                gap: 18,
              }}
            >
              {/* icon */}
              <div
                className="grid place-items-center flex-shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 13,
                  background:
                    role.status === "accepted"
                      ? "#dcfce7"
                      : role.status === "rejected"
                        ? "#fee2e2"
                        : "#dbeafe",
                }}
              >
                <span
                  className="ms"
                  style={{
                    fontSize: 26,
                    color:
                      role.status === "accepted"
                        ? "#166534"
                        : role.status === "rejected"
                          ? "#991b1b"
                          : "#1e40af",
                  }}
                >
                  {role.status === "accepted"
                    ? "check_circle"
                    : role.status === "rejected"
                      ? "cancel"
                      : "assignment_ind"}
                </span>
              </div>

              {/* details */}
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: "-0.02em",
                    color: "var(--on-bg)",
                    marginBottom: 4,
                  }}
                >
                  {role.role_title}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    marginBottom: 8,
                  }}
                >
                  {role.event_name}
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {role.description}
                </p>

                {/* metadata row */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className="flex items-center gap-1"
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 14 }}>
                      calendar_today
                    </span>
                    {new Date(role.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 14 }}>
                      location_on
                    </span>
                    {role.venue}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 14 }}>
                      group
                    </span>
                    {role.slots_available}/{role.slots_total} spots
                  </span>
                </div>

                {/* skill tags */}
                {role.skills.length > 0 && (
                  <div className="flex gap-2 flex-wrap" style={{ marginTop: 10 }}>
                    {role.skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: "var(--low)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--on-var)",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* action */}
              <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                {role.status === "open" && (
                  <button
                    style={{
                      padding: "9px 20px",
                      borderRadius: 9,
                      border: "none",
                      background: "linear-gradient(135deg, #4338ca, #6366f1)",
                      color: "white",
                      fontFamily: "Manrope, sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MS n="send" size={14} />
                    Apply
                  </button>
                )}
                {role.status === "applied" && (
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "#dbeafe",
                      color: "#1e40af",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    Pending
                  </span>
                )}
                {role.status === "accepted" && (
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "#dcfce7",
                      color: "#166534",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    Accepted
                  </span>
                )}
                {role.status === "rejected" && (
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
