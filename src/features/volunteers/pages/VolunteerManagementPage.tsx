import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Volunteers pool - volunteer management, shift coverage, and skills matrix. */
export default function VolunteerManagementPage() {
  const { toast, toastEl } = useToast();

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
            <button className="btn-sm primary" onClick={() => toast("Add volunteer")}>
              <MS n="person_add" size={13} />
              Add volunteer
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="volunteer_activism" color="lav" label="Active volunteers" value="0" />
        <KPI icon="schedule" color="pch" label="Hours this month" value="0" />
        <KPI icon="check_circle" color="mnt" label="Fill rate" value="—" />
        <KPI icon="mark_email_unread" color="crl" label="Pending apps" value="0" />
      </div>

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Volunteer hours · 12 months</span>
          </div>
          <div
            className="panel-body"
            style={{ height: 264, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <p style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13 }}>No data yet</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Shift coverage · this week</span>
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
            <span className="panel-title">Skill matrix · volunteers per skill area</span>
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
            <span className="panel-title">Top volunteers · by hours YTD</span>
          </div>
          <div className="panel-body flush">
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
          <span className="panel-title">All volunteers</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Skill</th>
                <th>Events</th>
                <th>Hours</th>
                <th>Rating</th>
                <th>Status</th>
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
