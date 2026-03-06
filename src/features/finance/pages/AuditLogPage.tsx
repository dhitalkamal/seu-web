import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS } from "@/shared/components/v8";

/** Org-level audit log page. */
export default function AuditLogPage() {
  return (
    <AppLayout variant="org">
      <PH
        crumbs={["Governance", "Audit log"]}
        title="Audit log"
        sub="Every privileged action in this workspace. Immutable, append-only, retained 7 years."
        actions={
          <>
            <button className="btn-sm">
              <MS n="filter_alt" size={13} />
              Filter
            </button>
            <button className="btn-sm">
              <MS n="download" size={13} />
              Export
            </button>
            <button className="btn-sm">
              <MS n="schedule_send" size={13} />
              Schedule digest
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="history" color="lav" label="Events (30d)" value="N/A" />
        <KPI icon="person" color="pch" label="Distinct actors" value="N/A" />
        <KPI icon="warning" color="crl" label="Privileged actions" value="N/A" />
        <KPI icon="lock" color="mnt" label="Retention" value="7y" />
      </div>

      <div className="notice" style={{ borderLeftColor: "var(--primary)" }}>
        <MS n="info" style={{ color: "var(--primary)" }} />
        <div>
          <strong>Audit logging available in the superadmin dashboard</strong>
          <span>
            Full workspace audit logs, actor drill-downs, and CSV exports are available to
            superadmins at the platform level. Organisation-scoped audit history will be available
            in a future release.
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Recent activity</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Newest first / UTC
          </span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Meta</th>
                <th>Origin</th>
              </tr>
            </thead>
            <tbody>
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
                  Organisation-scoped audit logs are not yet available. See the superadmin dashboard
                  for the full audit trail.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
