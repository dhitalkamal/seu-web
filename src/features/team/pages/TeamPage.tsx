import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import orgApi from "@/features/orgs/api/org.api";
import type { OrgMember, OrgMemberRole } from "@/features/orgs/types/org.types";
import { useOrgStore } from "@/shared/store/org.store";

// * helpers

/**
 * Capitalise the first letter of a role string.
 *
 * @param role - raw role value
 * @returns formatted label
 */
function roleLabel(role: OrgMemberRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// * component

/** Team members page - roles, permissions, activity, and access controls. */
export default function TeamPage() {
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<OrgMemberRole>("member");

  // fetch org members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => orgApi.listMembers(orgId),
    enabled: !!orgId,
  });

  // fetch pending invites
  const { data: invites = [] } = useQuery({
    queryKey: ["org-invites", orgId],
    queryFn: () => orgApi.listInvites(orgId),
    enabled: !!orgId,
  });

  /** Reset form fields and close the modal. */
  function closeModal() {
    setShowModal(false);
    setUserId("");
    setRole("member");
  }

  // add member mutation
  const inviteMutation = useMutation({
    mutationFn: () => orgApi.addMember(orgId, { user_id: userId.trim(), role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
      toast("Member added");
      closeModal();
    },
    onError: () => toast("Failed to add member"),
  });

  /** Submit the add-member form after basic validation. */
  function handleInvite() {
    if (!userId.trim()) {
      toast("User ID is required");
      return;
    }
    if (!orgId) {
      toast("No organization loaded");
      return;
    }
    inviteMutation.mutate();
  }

  const activeCount = members.filter((m: OrgMember) => m.is_active).length;

  // role breakdown for sidebar
  const roleCounts = members.reduce(
    (acc: Record<string, number>, m: OrgMember) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Members"]}
        title="Team members"
        sub="Roles, permissions, activity, and access controls."
        actions={
          <>
            <button className="btn-sm">
              <MS n="key" size={13} />
              Audit access
            </button>
            <button className="btn-sm primary" onClick={() => setShowModal(true)}>
              <MS n="person_add" size={13} />
              Invite
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="group" color="lav" label="Team size" value={String(members.length)} />
        <KPI icon="verified_user" color="pch" label="Active" value={String(activeCount)} />
        <KPI
          icon="mark_email_unread"
          color="crl"
          label="Pending invites"
          value={String(invites.length)}
        />
        <KPI
          icon="verified"
          color="mnt"
          label="2FA enrolled"
          value={`${members.length}/${members.length}`}
          trendKind="steady"
        />
      </div>

      {/* add team member modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }}
          >
            {/* modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MS n="person_add" size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Add team member</div>
                  <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 2 }}>
                    Grant a user access to this organization
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <MS n="close" size={14} />
              </button>
            </div>

            {/* modal body */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* user id */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  User ID <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="UUID of the user to add"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* role */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Role <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgMemberRole)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            {/* modal footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button
                className="btn-sm"
                onClick={closeModal}
                style={{ border: "1px solid var(--mid)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                className="btn-sm"
                onClick={handleInvite}
                disabled={!userId.trim() || inviteMutation.isPending}
                style={{
                  background: !userId.trim() || inviteMutation.isPending ? "var(--mid)" : "#050a26",
                  color: "white",
                  border: "none",
                }}
              >
                {inviteMutation.isPending ? "Adding..." : "Add member"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All members</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        color: "var(--on-mut)",
                        fontSize: 13,
                        padding: "48px 0",
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && members.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        color: "var(--on-mut)",
                        fontSize: 13,
                        padding: "48px 0",
                      }}
                    >
                      No members yet
                    </td>
                  </tr>
                )}
                {members.map((m: OrgMember) => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                      {m.user_id}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background:
                            m.role === "owner" || m.role === "admin" ? "#dce1ff" : "#f3f4f6",
                          color:
                            m.role === "owner" || m.role === "admin"
                              ? "var(--primary)"
                              : "var(--on-var)",
                        }}
                      >
                        {roleLabel(m.role)}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                      {new Date(m.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: m.is_active ? "#dcfce7" : "#fee2e2",
                          color: m.is_active ? "#166534" : "#991b1b",
                        }}
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Role distribution</span>
          </div>
          <div className="panel-body">
            {Object.keys(roleCounts).length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "48px 0",
                }}
              >
                No data yet
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {(Object.entries(roleCounts) as [string, number][]).map(([r, count]) => (
                  <div key={r} className="flex items-center justify-between">
                    <span
                      style={{ fontSize: 13, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
                    >
                      {roleLabel(r as OrgMemberRole)}
                    </span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        color: "var(--on-mut)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
