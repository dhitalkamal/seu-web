import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useMyRegistrations } from "@/features/registration/hooks/useRegistrations";
import type { Registration } from "@/features/registration/types";

/**
 * Formats an ISO date string to "Mon DD, YYYY".
 * @param dateStr - ISO date string.
 * @returns human-readable date.
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Groups past registrations by year and returns yearly counts sorted ascending.
 * @param regs - array of past registrations.
 * @returns array of { y: string; v: number } for chart rendering.
 */
function buildYearlyCounts(regs: Registration[]): { y: string; v: number }[] {
  const counts: Record<string, number> = {};
  for (const r of regs) {
    const year = new Date(r.created_at).getFullYear().toString();
    counts[year] = (counts[year] ?? 0) + 1;
  }
  const years = Object.keys(counts).sort();
  return years.map((y) => ({ y, v: counts[y] }));
}

/** Past events page - shows completed/cancelled registrations with bar chart and history table. */
export default function HistoryPage() {
  const { toast, toastEl } = useToast();
  const { data: registrations, isLoading } = useMyRegistrations();

  // * Past = checked_in, cancelled, no_show (i.e. non-active)
  const past: Registration[] = (registrations ?? []).filter(
    (r) => r.status === "checked_in" || r.status === "cancelled" || r.status === "no_show"
  );

  const byYear = buildYearlyCounts(past);
  const maxCount = Math.max(1, ...byYear.map((y) => y.v));
  const totalAttended = past.length;

  // * Unique event IDs as a rough "institutions" / "events" count
  const uniqueEvents = new Set(past.map((r) => r.event_id)).size;

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Past Events"]}
        title="Past events"
        sub="Every programme you've attended."
        actions={
          <button className="btn-sm" onClick={() => toast("Year in review")}>
            <MS n="auto_awesome" size={13} />
            Year in review
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI
          icon="event_available"
          color="lav"
          label="Attended"
          value={totalAttended > 0 ? String(totalAttended) : "—"}
        />
        <KPI icon="payments" color="pch" label="Total spent" value="—" />
        <KPI
          icon="domain"
          color="mnt"
          label="Unique events"
          value={uniqueEvents > 0 ? String(uniqueEvents) : "—"}
        />
        <KPI icon="star" color="crl" label="Avg rating given" value="—" />
      </div>

      {isLoading && (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--on-mut)" }}>
          Loading history...
        </div>
      )}

      {!isLoading && past.length === 0 && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <MS n="history" size={32} />
          <div
            style={{ marginTop: 12, fontWeight: 600, fontSize: 16, fontFamily: "Space Grotesk" }}
          >
            No past events yet
          </div>
          <div style={{ color: "var(--on-mut)", fontSize: 13, marginTop: 4 }}>
            Events you have attended will appear here.
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="chart-grid-2">
          {/* yearly attendance bar chart */}
          {byYear.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Attendance by year</span>
              </div>
              <div
                className="panel-body"
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-end",
                  padding: "22px 24px 18px",
                }}
              >
                {byYear.map((y, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Space Grotesk",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "-0.025em",
                        color: y.v > 0 ? "var(--on-bg)" : "var(--on-mut)",
                      }}
                    >
                      {y.v || "-"}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 80,
                        background: "var(--low)",
                        borderRadius: 6,
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${(y.v / maxCount) * 100}%`,
                          background:
                            y.v === maxCount ? "#e83151" : y.v > 0 ? "#050a26" : "transparent",
                          borderRadius: "5px 5px 0 0",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 10,
                        color: "var(--on-mut)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {y.y}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {past.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All past registrations</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Registration code</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {past.map((r) => (
                  <tr key={r.id} onClick={() => toast(r.registration_code + " details")}>
                    <td style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                      {r.registration_code}
                    </td>
                    <td>{r.event_id.slice(0, 8)}</td>
                    <td>
                      <span
                        className={`pill ${r.status === "checked_in" ? "active" : r.status === "cancelled" ? "muted" : "draft"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{r.quantity}</td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {fmtDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
