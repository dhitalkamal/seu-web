import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Audit log - immutable action table. */
export default function AuditLogPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Governance", "Audit log"]}
        title="Audit log"
        sub="Every privileged action in this workspace. Immutable, append-only, retained 7 years."
        actions={
          <>
            <button className="btn-sm" onClick={() => toast("Filter")}>
              <MS n="filter_alt" size={13} />
              Filter
            </button>
            <button className="btn-sm" onClick={() => toast("CSV export queued")}>
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
        <KPI icon="history" color="lav" label="Events (30d)" value="0" />
        <KPI icon="person" color="pch" label="Distinct actors" value="0" />
        <KPI icon="warning" color="crl" label="Privileged actions" value="0" />
        <KPI icon="lock" color="mnt" label="Retention" value="7y" />
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
            Newest first · UTC
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
                  No data yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
