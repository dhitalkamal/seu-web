import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import { useOrgContext } from "@/features/orgs/hooks/useOrgContext";

/** Org overview dashboard - gated behind org approval. */
export default function OrgDashboardPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  useOrgContext();
  const org = useOrgStore((s) => s.org);
  const loaded = useOrgStore((s) => s.loaded);

  // loading guard - render placeholder until org store is ready
  if (!loaded) {
    return (
      <AppLayout variant="user">
        <div
          style={{
            padding: "80px 0",
            textAlign: "center",
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Loading...
        </div>
      </AppLayout>
    );
  }

  // ! Gate: org missing or not approved - hard redirect so users never see a partial dashboard
  if (!isOrgActive(org)) {
    navigate("/profile", { replace: true });
    return null;
  }

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Overview"]}
        title="Organization overview"
        sub="Workspace operations, registration health, financial performance, and team activity in real time."
        actions={
          <>
            <button className="btn-sm">
              <MS n="date_range" size={13} />
              Last 12 months
            </button>
            <button className="btn-sm" onClick={() => toast("Export started")}>
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      {/* KPI row - placeholder values until analytics API is wired */}
      <div className="kpi-grid">
        <KPI icon="how_to_reg" color="lav" label="Registrations" value="-" />
        <KPI icon="payments" color="pch" label="Revenue YTD" value="-" />
        <KPI icon="rocket_launch" color="crl" label="Active Events" value="0" />
        <KPI icon="group_add" color="nav" label="Volunteers" value="0" />
      </div>

      {/* Revenue chart + workspace integrity */}
      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue - last 12 months</span>
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.025em",
              }}
            >
              -
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
        <div className="depth">
          <div className="depth-ic">
            <MS n="verified_user" size={112} />
          </div>
          <h4>Workspace Integrity</h4>
          <p>Connect your workspace to see compliance status.</p>
          <div className="depth-status">
            <span className="pulse" />
            Awaiting data
          </div>
        </div>
      </div>

      {/* Event pipeline / mix / registrations - empty */}
      <div className="chart-grid-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event pipeline</span>
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
            <span className="panel-title">Event mix</span>
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
            <span className="panel-title">Registrations - cumulative YTD</span>
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

      {/* Active events table + audit log */}
      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Active events</span>
            <button className="btn-sm" onClick={() => navigate("/events/mine")}>
              View all
            </button>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Registrations</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={4}
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

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Audit log</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No activity yet
          </div>
        </div>
      </div>

      {/* Top events + team health - empty */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Top events by revenue YTD</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Team &amp; volunteer health</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
