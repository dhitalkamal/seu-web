import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Waitlist management - FIFO queue table. */
export default function WaitlistPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Waitlist"]}
        title="Waitlist"
        sub="FIFO queue of attendees waiting for spots to open. Promote the next person when a cancellation creates capacity."
        actions={
          <>
            <select className="btn-sm" style={{ padding: "7px 13px" }}>
              <option>All events</option>
            </select>
            <button className="btn-sm primary" onClick={() => toast("No entries to promote")}>
              <MS n="trending_up" size={13} />
              Promote next
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="hourglass_top" color="lav" label="On waitlist" value="0" />
        <KPI icon="trending_up" color="pch" label="Promoted (7d)" value="0" />
        <KPI icon="schedule" color="crl" label="Expiring in 48h" value="0" />
        <KPI icon="cancel" color="mnt" label="Expired (30d)" value="0" />
      </div>

      <div className="notice" style={{ borderLeftColor: "var(--tertiary)" }}>
        <MS n="info" style={{ color: "var(--tertiary)" }} />
        <div>
          <strong>How promotion works</strong>
          <span>
            When a confirmed registration is cancelled, the next person on the list is notified.
            They have 24 hours to claim the spot before it passes to the next entry.
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Queue · FIFO order</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Attendee</th>
                <th>Event</th>
                <th>Joined</th>
                <th>Expires in</th>
                <th style={{ width: 160 }}>Action</th>
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
