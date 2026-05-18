import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Reports & exports - one-off and scheduled report generation. */
export default function ReportsPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Reports"]}
        title="Reports & exports"
        sub="Generate CSV, PDF, JSON, and Excel reports across the workspace. Schedule recurring digests."
        actions={
          <>
            <button className="btn-sm">
              <MS n="api" size={13} />
              API access
            </button>
            <button className="btn-sm primary" onClick={() => toast("Custom report builder")}>
              <MS n="add" size={13} />
              Custom report
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="description" color="lav" label="Report types" value="0" />
        <KPI icon="download" color="pch" label="Generated (30d)" value="0" />
        <KPI icon="schedule_send" color="mnt" label="Scheduled" value="0" />
        <KPI icon="storage" color="crl" label="Archive size" value="—" />
      </div>

      <div className="chart-grid-21">
        <div>
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            One-off exports
          </div>
          <div className="panel">
            <div className="panel-body">
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
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Scheduled
          </div>
          <div className="panel">
            <div className="panel-body">
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
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
