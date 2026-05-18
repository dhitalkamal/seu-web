import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Refunds queue - approve/reject actions and policy card. */
export default function RefundsPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Refunds"]}
        title="Refund requests"
        sub="Attendees can request a refund on completed orders. Approve to issue via the original gateway."
        actions={
          <>
            <button className="btn-sm">
              <MS n="rule" size={13} />
              Refund policy
            </button>
            <button className="btn-sm primary" onClick={() => toast("No pending refunds")}>
              <MS n="done_all" size={13} />
              Approve pending
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="pending" color="crl" label="Pending review" value="0" />
        <KPI icon="check_circle" color="lav" label="Approved (30d)" value="0" />
        <KPI icon="block" color="pch" label="Rejected (30d)" value="0" />
        <KPI icon="percent" color="mnt" label="Refund rate" value="—" />
      </div>

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All requests</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Pending", "Approved", "Rejected"].map((t, i) => (
                <button
                  key={i}
                  className="btn-sm"
                  style={{ background: i === 0 ? "var(--low)" : "white" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event · Attendee</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={7}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="depth">
            <div className="depth-ic">
              <MS n="undo" size={112} />
            </div>
            <h4>Policy snapshot</h4>
            <p>
              Refunds accepted within 7 days of registration or up to 72h before the event,
              whichever is earlier. Auto-refund on event cancellation.
            </p>
            <div className="depth-status">
              <span className="pulse" />
              Policy applied
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">By gateway · 30d</span>
            </div>
            <div className="panel-body">
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "24px 0",
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
