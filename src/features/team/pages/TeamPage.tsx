import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Team members page - roles, permissions, activity, and access controls. */
export default function TeamPage() {
  const { toast, toastEl } = useToast();

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
            <button className="btn-sm primary" onClick={() => toast("Invite sent")}>
              <MS n="person_add" size={13} />
              Invite
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="group" color="lav" label="Team size" value="0" />
        <KPI icon="schedule" color="pch" label="Active (7d)" value="0" />
        <KPI icon="mark_email_unread" color="crl" label="Pending invites" value="0" />
        <KPI icon="verified" color="mnt" label="2FA enrolled" value="—" />
      </div>

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All members</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Last active</th>
                  <th>2FA</th>
                  <th>Status</th>
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

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Role distribution</span>
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
          <span className="panel-title">Permissions matrix</span>
        </div>
        <div className="panel-body">
          <p
            style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
          >
            No data yet
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <span className="panel-title">Recent access events</span>
        </div>
        <div className="panel-body">
          <p
            style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
          >
            No data yet
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
