import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Participation records - funnels, cohorts, ticket mix, and demographic breakdown. */
export default function ParticipationPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Participation"]}
        title="Participation records"
        sub="Attendees as people, not rows. Funnels, cohorts, ticket mix, and demographic breakdown."
        actions={
          <>
            <button className="btn-sm">
              <MS n="filter_alt" size={13} />
              Filter
            </button>
            <button className="btn-sm" onClick={() => toast("Exporting CSV...")}>
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="groups" color="lav" label="Registrants" value="0" />
        <KPI icon="how_to_reg" color="pch" label="Check-in rate" value="—" />
        <KPI icon="autorenew" color="mnt" label="Returning" value="0" />
        <KPI icon="paid" color="crl" label="Avg ticket" value="—" />
      </div>

      <div className="chart-grid-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registration funnel</span>
          </div>
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

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Ticket type mix</span>
          </div>
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

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Returning vs new</span>
          </div>
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

      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Cohort retention</span>
          </div>
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

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Top affiliations</span>
          </div>
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

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Recent registrants</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Registrant</th>
                <th>Event</th>
                <th>Ticket</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={5}
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
