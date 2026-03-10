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

  const [showInvite, setShowInvite] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<OrgMemberRole>("member");

  // fetch org members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => orgApi.listMembers(orgId),
    enabled: !!orgId,
  });

  // add member mutation
  const inviteMutation = useMutation({
    mutationFn: () => orgApi.addMember(orgId, { user_id: userId.trim(), role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
      toast("Member added");
      setShowInvite(false);
      setUserId("");
      setRole("member");
    },
    onError: () => toast("Failed to add member"),
  });

  /** Submit the invite form after basic validation. */
  function handleInvite() {
    if (!userId.trim()) {
      toast("User ID is required");
      return;
    }
    if (!orgId) {
      toast("No organisation loaded");
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
            <button className="btn-sm primary" onClick={() => setShowInvite(true)}>
              <MS n="person_add" size={13} />
              Invite
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="group" color="lav" label="Team size" value={String(members.length)} />
        <KPI icon="verified_user" color="pch" label="Active" value={String(activeCount)} />
        <KPI icon="mark_email_unread" color="crl" label="Pending invites" value="0" />
        <KPI icon="verified" color="mnt" label="2FA enrolled" value="N/A" />
      </div>

      {/* invite form */}
      {showInvite && (
        <div className="panel" style={{ marginBottom: 18, borderColor: "var(--primary)" }}>
          <div className="panel-head">
            <span className="panel-title">Add member</span>
            <button className="modal-x" onClick={() => setShowInvite(false)}>
              <MS n="close" size={14} />
            </button>
          </div>
          <div className="panel-body">
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}
            >
              <div className="field">
                <label className="field-lab">User ID</label>
                <input
                  className="field-in"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="UUID of the user to add"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
              </div>
              <div className="field">
                <label className="field-lab">Role</label>
                <select
                  className="field-in"
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgMemberRole)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-sm" onClick={() => setShowInvite(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleInvite}
                disabled={inviteMutation.isPending}
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
