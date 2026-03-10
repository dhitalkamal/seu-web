import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS } from "@/shared/components/v8";
import registrationApi from "@/features/registration/api/registration.api";

/** Waitlist management - FIFO queue with auto-promotion notice. */
export default function WaitlistPage() {
  // pull registration list to surface a waitlisted count in the KPI
  // the participation service does not expose a dedicated waitlist list endpoint;
  // server-side auto-promotion handles slot assignment when cancellations occur
  const { data: registrations = [] } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: registrationApi.listMine,
  });

  const waitlistedCount = registrations.filter(
    (r) => (r as { status?: string }).status === "waitlisted"
  ).length;

  return (
    <AppLayout variant="org">
      <PH
        crumbs={["Operations", "Waitlist"]}
        title="Waitlist"
        sub="FIFO queue of attendees waiting for spots to open. Promotion happens automatically when a cancellation creates capacity."
        actions={
          <select className="btn-sm" style={{ padding: "7px 13px" }}>
            <option>All events</option>
          </select>
        }
      />

      <div className="kpi-grid">
        <KPI icon="hourglass_top" color="lav" label="On waitlist" value={String(waitlistedCount)} />
        <KPI icon="trending_up" color="pch" label="Promoted (7d)" value="N/A" />
        <KPI icon="schedule" color="crl" label="Expiring in 48h" value="N/A" />
        <KPI icon="cancel" color="mnt" label="Expired (30d)" value="N/A" />
      </div>

      {/* auto-promotion notice */}
      <div className="notice" style={{ borderLeftColor: "var(--tertiary)" }}>
        <MS n="info" style={{ color: "var(--tertiary)" }} />
        <div>
          <strong>Waitlist auto-promotion is handled automatically by the system</strong>
          <span>
            When a confirmed registration is cancelled, the next person on the waitlist is notified.
            They have 24 hours to claim the spot before it passes to the next entry. No manual
            action is required.
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Queue - FIFO order</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Attendee</th>
                <th>Event</th>
                <th>Joined</th>
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
                  Waitlist data is managed server-side. Contact support to view the full queue.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
