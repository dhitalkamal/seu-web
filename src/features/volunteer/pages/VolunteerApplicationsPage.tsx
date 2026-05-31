import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import volunteerRolesApi from "@/features/volunteer-apps/api/volunteer-roles.api";
import type { VolunteerRole } from "@/features/volunteer-apps/api/volunteer-roles.api";

// * types

type Tab = "browse" | "applied" | "accepted" | "rejected";

// * component

/** Browse open volunteer roles and manage applications. */
export default function VolunteerApplicationsPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [applying, setApplying] = useState<string | null>(null);
  const qc = useQueryClient();

  // fetch all roles from the backend
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["volunteer-roles"],
    queryFn: () => volunteerRolesApi.listRoles(),
  });

  // fetch my applications
  const { data: myApps = [] } = useQuery({
    queryKey: ["my-volunteer-apps"],
    queryFn: () => volunteerRolesApi.myApplications(),
  });

  // apply mutation - fires apply() then invalidates the roles query so status re-renders
  const applyMutation = useMutation({
    mutationFn: ({ roleId, eventId }: { roleId: string; eventId: string }) =>
      volunteerRolesApi.apply(roleId, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer-roles"] });
      qc.invalidateQueries({ queryKey: ["my-volunteer-apps"] });
      setApplying(null);
    },
    onError: () => setApplying(null),
  });

  /**
   * Derive slot status for a role based on filled/slots ratio.
   *
   * @param r - volunteer role
   * @returns "open" when slots remain, "full" when all slots are taken
   */
  function roleStatus(r: VolunteerRole): "open" | "full" {
    const cap = r.capacity ?? r.slots ?? 0;
    const filled = r.filled ?? 0;
    return filled < cap ? "open" : "full";
  }

  // filter by tab - "browse" shows all open roles, other tabs need a /my-applications endpoint
  const filtered: VolunteerRole[] =
    tab === "browse" ? roles.filter((r) => roleStatus(r) === "open") : [];

  const filteredApps =
    tab === "applied"
      ? myApps.filter((a) => a.status === "pending")
      : tab === "accepted"
        ? myApps.filter((a) => a.status === "approved" || a.status === "confirmed")
        : tab === "rejected"
          ? myApps.filter((a) => a.status === "rejected")
          : [];

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

      {/* loading state */}
      {isLoading && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "56px 28px",
            textAlign: "center",
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
            fontSize: 13,
          }}
        >
          Loading roles...
        </div>
      )}

      {/* my applications list for non-browse tabs */}
      {!isLoading && tab !== "browse" && filteredApps.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title" style={{ textTransform: "capitalize" }}>
              {tab} applications
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {filteredApps.length}
            </span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>
                      {app.volunteer_role_id?.slice(0, 8) ?? app.role_id?.slice(0, 8) ?? "..."}
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                      {app.event_id?.slice(0, 8) ?? "..."}
                    </td>
                    <td>
                      <span
                        className={`pill ${app.status === "approved" || app.status === "confirmed" ? "active" : app.status === "rejected" ? "suspended" : "pending"}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "var(--on-mut)",
                      }}
                    >
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* empty state */}
      {!isLoading && filtered.length === 0 && filteredApps.length === 0 && (
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
              ? "Check back later - organizers post new volunteer roles as events approach."
              : `Your ${tab} applications will appear here once you start applying for roles.`}
          </p>
        </div>
      )}

      {/* role cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((role) => {
            const isApplying = applying === role.id && applyMutation.isPending;
            // check if user already applied for this role
            const existingApp = myApps.find(
              (a) =>
                (a.volunteer_role_id === role.id || a.role_id === role.id) &&
                a.status !== "cancelled"
            );
            const isPending = existingApp?.status === "pending";
            const isApproved =
              existingApp?.status === "approved" || existingApp?.status === "confirmed";
            const isRejected = existingApp?.status === "rejected";
            const alreadyApplied = !!existingApp;

            return (
              <div
                key={role.id}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isApproved ? "#16a34a" : isPending ? "#dba13d" : "var(--outline)"}`,
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  gap: 18,
                }}
              >
                {/* icon */}
                <div
                  className="grid place-items-center shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    background: isApproved ? "#dcfce7" : isPending ? "#fef3c7" : "#dbeafe",
                  }}
                >
                  <span
                    className="ms"
                    style={{
                      fontSize: 26,
                      color: isApproved ? "#166534" : isPending ? "#92400e" : "#1e40af",
                    }}
                  >
                    {isApproved ? "check_circle" : isPending ? "hourglass_top" : "assignment_ind"}
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
                    {role.name || role.title}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 4,
                    }}
                  >
                    Event: {role.event_id?.slice(0, 8) ?? "..."}
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
                      {new Date(role.created_at).toLocaleDateString("en-US", {
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
                        group
                      </span>
                      {(role.capacity ?? role.slots ?? 0) - (role.filled ?? 0)}/
                      {role.capacity ?? role.slots ?? 0} spots left
                    </span>
                  </div>
                </div>

                {/* action */}
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  {isApproved ? (
                    <span
                      style={{
                        padding: "9px 20px",
                        borderRadius: 9,
                        background: "#dcfce7",
                        color: "#166534",
                        fontFamily: "Manrope, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="check_circle" size={14} />
                      Approved
                    </span>
                  ) : isPending ? (
                    <span
                      style={{
                        padding: "9px 20px",
                        borderRadius: 9,
                        background: "#fef3c7",
                        color: "#92400e",
                        fontFamily: "Manrope, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="hourglass_top" size={14} />
                      Pending
                    </span>
                  ) : isRejected ? (
                    <span
                      style={{
                        padding: "9px 20px",
                        borderRadius: 9,
                        background: "#fee2e2",
                        color: "#991b1b",
                        fontFamily: "Manrope, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="cancel" size={14} />
                      Rejected
                    </span>
                  ) : (
                    <button
                      disabled={isApplying || alreadyApplied}
                      onClick={() => {
                        setApplying(role.id);
                        applyMutation.mutate({ roleId: role.id, eventId: role.event_id });
                      }}
                      style={{
                        padding: "9px 20px",
                        borderRadius: 9,
                        border: "none",
                        background: "linear-gradient(135deg, #4338ca, #6366f1)",
                        color: "white",
                        fontFamily: "Manrope, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isApplying ? "not-allowed" : "pointer",
                        opacity: isApplying ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="send" size={14} />
                      {isApplying ? "Applying..." : "Apply"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
