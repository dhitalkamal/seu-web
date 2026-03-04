import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import volunteerRolesApi from "@/features/volunteer-apps/api/volunteer-roles.api";
import type { VolunteerRole } from "@/features/volunteer-apps/api/volunteer-roles.api";
import { useOrgStore } from "@/shared/store/org.store";

// * types

type CreateRoleForm = {
  title: string;
  description: string;
  slots: string;
};

// * component

/** Volunteers pool - volunteer management, shift coverage, and skills matrix. */
export default function VolunteerManagementPage() {
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const qc = useQueryClient();

  // create-role form visibility
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRoleForm>({ title: "", description: "", slots: "1" });

  // fetch all roles for this org's events
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["org-volunteer-roles"],
    queryFn: () => volunteerRolesApi.listRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      event_id: string;
      title: string;
      description: string;
      slots: number;
    }) => volunteerRolesApi.createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-volunteer-roles"] });
      toast("Volunteer role created");
      setShowForm(false);
      setForm({ title: "", description: "", slots: "1" });
    },
    onError: () => toast("Failed to create role"),
  });

  /**
   * Validate and submit the create-role form.
   * Requires an org to be loaded so we have an event_id context.
   */
  function handleCreate() {
    if (!form.title.trim() || !form.description.trim()) {
      toast("Title and description are required");
      return;
    }
    if (!orgId) {
      toast("No organisation loaded");
      return;
    }
    // event_id is required by the API; use orgId as a placeholder when no
    // specific event is selected - organisers can refine per-event in a later flow
    createMutation.mutate({
      event_id: orgId,
      title: form.title.trim(),
      description: form.description.trim(),
      slots: Math.max(1, Number(form.slots) || 1),
    });
  }

  const totalSlots = roles.reduce((s: number, r: VolunteerRole) => s + r.slots, 0);
  const filledSlots = roles.reduce((s: number, r: VolunteerRole) => s + r.filled, 0);
  const fillRate = totalSlots > 0 ? `${Math.round((filledSlots / totalSlots) * 100)}%` : "N/A";

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Volunteers"]}
        title="Volunteers pool"
        sub="Volunteers, applications, shift coverage, and skills matrix."
        actions={
          <>
            <button className="btn-sm">
              <MS n="calendar_month" size={13} />
              Schedule
            </button>
            <button className="btn-sm primary" onClick={() => setShowForm(true)}>
              <MS n="person_add" size={13} />
              Add volunteer role
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI
          icon="volunteer_activism"
          color="lav"
          label="Active roles"
          value={String(roles.length)}
        />
        <KPI icon="group" color="pch" label="Total slots" value={String(totalSlots)} />
        <KPI icon="check_circle" color="mnt" label="Fill rate" value={fillRate} />
        <KPI
          icon="mark_email_unread"
          color="crl"
          label="Filled slots"
          value={String(filledSlots)}
        />
      </div>

      {/* create role form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: 18, borderColor: "var(--primary)" }}>
          <div className="panel-head">
            <span className="panel-title">New volunteer role</span>
            <button className="modal-x" onClick={() => setShowForm(false)}>
              <MS n="close" size={14} />
            </button>
          </div>
          <div className="panel-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className="field">
                <label className="field-lab">Title</label>
                <input
                  className="field-in"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Stage crew"
                />
              </div>
              <div className="field">
                <label className="field-lab">Slots available</label>
                <input
                  className="field-in"
                  type="number"
                  min={1}
                  value={form.slots}
                  onChange={(e) => setForm((f) => ({ ...f, slots: e.target.value }))}
                />
              </div>
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label className="field-lab">Description</label>
                <textarea
                  className="field-in"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the role and responsibilities"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-sm" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* roles table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">All volunteer roles</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Slots</th>
                <th>Filled</th>
                <th>Fill rate</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
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
              {!isLoading && roles.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    No volunteer roles yet. Create one above.
                  </td>
                </tr>
              )}
              {roles.map((r: VolunteerRole) => {
                const rate = r.slots > 0 ? Math.round((r.filled / r.slots) * 100) : 0;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.title}</td>
                    <td
                      style={{
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--on-mut)",
                        fontSize: 12,
                      }}
                    >
                      {r.description}
                    </td>
                    <td>{r.slots}</td>
                    <td>{r.filled}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: rate >= 80 ? "#dcfce7" : rate >= 40 ? "#dbeafe" : "#fee2e2",
                          color: rate >= 80 ? "#166534" : rate >= 40 ? "#1e40af" : "#991b1b",
                        }}
                      >
                        {rate}%
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "var(--on-mut)",
                      }}
                    >
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
