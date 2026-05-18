import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Analytics overview — empty state, ready for API wiring. */
export default function EventAnalyticsPage() {
  const { toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Analytics"]}
        title="Analytics overview"
        sub="Registration funnels, revenue trends, cohort retention, and event performance."
        actions={
          <>
            <button className="btn-sm">
              <MS n="date_range" size={13} />
              Last 12 months
            </button>
            <button className="btn-sm">
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      {/* KPI row — placeholder values until analytics API is wired */}
      <div className="kpi-grid">
        <KPI icon="visibility" color="lav" label="Page views" value="—" />
        <KPI icon="how_to_reg" color="pch" label="Registrations" value="—" />
        <KPI icon="trending_up" color="mnt" label="Conversion" value="—" />
        <KPI icon="star" color="crl" label="Avg NPS" value="—" />
      </div>

      {/* Revenue + registrations charts */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue · 12 months</span>
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.025em",
              }}
            >
              —
            </span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registrations · cumulative</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>
      </div>

      {/* Funnel / revenue by category / NPS */}
      <div className="chart-grid-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registration funnel</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue by category</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">NPS by event type</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>
      </div>

      {/* Retention heatmap + top events table */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">
              Attendee retention · % returning by months after first event
            </span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Top events by attendance</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Reg.</th>
                  <th>Cap.</th>
                  <th>Revenue</th>
                  <th>NPS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "28px 0",
                      color: "var(--on-mut)",
                      fontSize: 13,
                    }}
                  >
                    No events yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
