import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import eventsApi from "@/features/events/api/events.api";
import checkinApi from "@/features/checkin/api/checkin.api";
import type { Event } from "@/features/events/types/event.types";

/** Build a CSV blob from an array of row objects and trigger a download. */
function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h] ?? "");
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Per-event stats row combining event data with check-in stats. */
type EventStatsRow = {
  event: Event;
  total: number;
  checkedIn: number;
  remaining: number;
};

/** Participation records - funnels, cohorts, ticket mix, and demographic breakdown. */
export default function ParticipationPage() {
  const { toast, toastEl } = useToast();

  // fetch all events owned by this organiser
  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
  const events: Event[] = eventsPage?.results ?? [];

  // fetch check-in stats for each event in parallel
  // returns an array of settled results so a single 404 doesn't break the whole page
  const { data: statsResults, isLoading: statsLoading } = useQuery({
    queryKey: ["checkin", "stats", "all", events.map((e) => e.id)],
    queryFn: async () => {
      const settled = await Promise.allSettled(
        events.map((e) => checkinApi.getEventStats(e.id))
      );
      return settled;
    },
    enabled: events.length > 0,
  });

  const isLoading = eventsLoading || statsLoading;

  // build combined rows from events + stats
  const rows: EventStatsRow[] = events.map((event, i) => {
    const result = statsResults?.[i];
    if (result?.status === "fulfilled") {
      return {
        event,
        total: result.value.total,
        checkedIn: result.value.checked_in,
        remaining: result.value.remaining,
      };
    }
    // fallback: use event.registered_count when stat fetch failed
    return {
      event,
      total: event.registered_count,
      checkedIn: 0,
      remaining: event.capacity - event.registered_count,
    };
  });

  // aggregate KPIs
  const totalRegistrants = rows.reduce((sum, r) => sum + r.total, 0);
  const totalCheckedIn = rows.reduce((sum, r) => sum + r.checkedIn, 0);
  const checkinRate =
    totalRegistrants > 0 ? Math.round((totalCheckedIn / totalRegistrants) * 100) : 0;

  /** Export aggregated stats as CSV. */
  function handleExport(): void {
    const csvRows = rows.map((r) => ({
      event_title: r.event.title,
      event_status: r.event.status,
      start_date: r.event.start_date,
      registered: r.total,
      checked_in: r.checkedIn,
      remaining: r.remaining,
      checkin_rate_pct:
        r.total > 0 ? Math.round((r.checkedIn / r.total) * 100) : 0,
    }));
    downloadCsv("participation.csv", csvRows);
    toast("Export downloaded");
  }

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
            <button className="btn-sm" onClick={handleExport}>
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      {/* KPI row - aggregated from check-in stats */}
      <div className="kpi-grid">
        <KPI
          icon="groups"
          color="lav"
          label="Registrants"
          value={isLoading ? "..." : totalRegistrants.toLocaleString()}
        />
        <KPI
          icon="how_to_reg"
          color="pch"
          label="Check-in rate"
          value={isLoading ? "..." : `${checkinRate}%`}
        />
        <KPI
          icon="autorenew"
          color="mnt"
          label="Checked in"
          value={isLoading ? "..." : totalCheckedIn.toLocaleString()}
        />
        <KPI icon="paid" color="crl" label="Avg ticket" value="-" />
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
            {isLoading ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "48px 0",
                }}
              >
                Loading...
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>Free events</span>
                  <span style={{ fontWeight: 600 }}>
                    {events.filter((e) => e.is_free).length}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>Paid events</span>
                  <span style={{ fontWeight: 600 }}>
                    {events.filter((e) => !e.is_free).length}
                  </span>
                </div>
              </div>
            )}
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

      {/* per-event participation table sourced from check-in stats */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Event participation summary</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Checked in</th>
                <th>Remaining</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
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
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
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
                    No events yet
                  </td>
                </tr>
              ) : (
                rows.map(({ event, total, checkedIn: ci, remaining }) => {
                  const rate = total > 0 ? Math.round((ci / total) * 100) : 0;
                  return (
                    <tr key={event.id}>
                      <td style={{ fontWeight: 500 }}>{event.title}</td>
                      <td style={{ textTransform: "capitalize" }}>{event.status}</td>
                      <td>{total}</td>
                      <td>{ci}</td>
                      <td>{remaining}</td>
                      <td>{rate}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
