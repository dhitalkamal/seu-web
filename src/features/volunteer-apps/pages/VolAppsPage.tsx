import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, useToast } from "@/shared/components/v8";
import volunteerRolesApi, { type VolunteerApplication } from "../api/volunteer-roles.api";

export default function VolAppsPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["volunteer-roles"],
    queryFn: () => volunteerRolesApi.listRoles(),
  });

  const allApplications = useQuery({
    queryKey: ["all-volunteer-applications"],
    queryFn: async () => {
      const apps: VolunteerApplication[] = [];
      for (const role of roles) {
        const roleApps = await volunteerRolesApi.listApplications(role.id);
        apps.push(...roleApps);
      }
      return apps;
    },
    enabled: roles.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => volunteerRolesApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-volunteer-applications"] });
      toast("Application approved");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => volunteerRolesApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-volunteer-applications"] });
      toast("Application rejected");
    },
  });

  const apps = allApplications.data ?? [];
  const filtered = apps.filter((a) => a.status === tab);
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Volunteer apps"]}
        title="Volunteer applications"
        sub="Review and manage incoming volunteer role applications."
      />

      <div className="kpi-grid">
        <KPI
          icon="pending_actions"
          color="pch"
          label="Pending"
          value={apps.filter((a) => a.status === "pending").length.toString()}
          trendKind={apps.filter((a) => a.status === "pending").length > 0 ? "warn" : "steady"}
        />
        <KPI
          icon="check_circle"
          color="mnt"
          label="Approved"
          value={apps.filter((a) => a.status === "approved").length.toString()}
        />
        <KPI
          icon="cancel"
          color="crl"
          label="Rejected"
          value={apps.filter((a) => a.status === "rejected").length.toString()}
        />
        <KPI icon="volunteer_activism" color="lav" label="Roles" value={roles.length.toString()} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["pending", "approved", "rejected"] as const).map((t) => {
          const active = tab === t;
          const count = apps.filter((a) => a.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: active ? "none" : "1px solid var(--mid)",
                background: active ? "#050a26" : "var(--surface)",
                color: active ? "white" : "var(--on-var)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textTransform: "capitalize",
              }}
            >
              {t}
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.15)" : "var(--low)",
                  color: active ? "rgba(255,255,255,0.8)" : "var(--on-mut)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">{tab} applications</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
            }}
          >
            {filtered.length}
          </span>
        </div>
        <div className="panel-body flush">
          {allApplications.isLoading || rolesLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
              No {tab} applications.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Message</th>
                  <th>Applied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const role = roleMap[app.role_id];
                  return (
                    <tr key={app.id}>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                        {app.user_id.slice(0, 8)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{role?.title ?? app.role_id.slice(0, 8)}</td>
                      <td
                        style={{
                          color: "var(--on-var)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {app.message || "-"}
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
                      <td>
                        {app.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn-sm primary"
                              onClick={() => approveMutation.mutate(app.id)}
                              disabled={approveMutation.isPending}
                              style={{ fontSize: 11 }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-sm danger"
                              onClick={() => rejectMutation.mutate(app.id)}
                              disabled={rejectMutation.isPending}
                              style={{ fontSize: 11 }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
