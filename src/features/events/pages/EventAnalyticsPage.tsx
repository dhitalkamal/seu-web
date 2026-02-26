import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import eventsApi from "@/features/events/api/events.api";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
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

/**
 * Analytics page - works in two modes:
 *   /org/events/:id/analytics  - per-event view using the event id from params
 *   /org/analytics             - org-wide aggregate view (no id param)
 */
export default function EventAnalyticsPage() {
  const { id: eventId } = useParams<{ id?: string }>();
  const { toast, toastEl } = useToast();

  // fetch the specific event when we have an id
  const { data: singleEventRes, isLoading: singleLoading } = useQuery({
    queryKey: ["events", eventId],
    queryFn: () => eventsApi.getEvent(eventId!),
    enabled: !!eventId,
  });
  const singleEvent = singleEventRes?.data ?? null;

  // fetch health score when we have an event id
  const { data: health } = useQuery({
    queryKey: ["intelligence", "health", eventId],
    queryFn: () => intelligenceApi.getEventHealth(eventId!),
    enabled: !!eventId,
  });

  // always fetch all org events for aggregate / top-events table
  const { data: eventsPage, isLoading: listLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
  const events: Event[] = eventsPage?.results ?? [];

  const isLoading = eventId ? singleLoading : listLoading;

  // aggregate KPIs from all events
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count ?? 0), 0);
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity ?? 0), 0);
  const conversionPct =
    totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  // per-event KPIs
  const eventRegistrations = singleEvent?.registered_count ?? 0;
  const eventCapacity = singleEvent?.capacity ?? 0;
  const eventFillPct =
    eventCapacity > 0 ? Math.round((eventRegistrations / eventCapacity) * 100) : 0;

  const kpiRegistrations = eventId
    ? eventRegistrations.toLocaleString()
    : isLoading
      ? "..."
      : totalRegistrations.toLocaleString();

  const kpiConversion = eventId
    ? `${eventFillPct}%`
    : isLoading
      ? "..."
      : `${conversionPct}%`;

  const kpiHealthScore =
    health != null ? health.health_score.toFixed(0) : isLoading ? "..." : "-";

  /** Export analytics data as CSV. */
  function handleExport(): void {
    const rows = (eventId && singleEvent ? [singleEvent] : events).map((e) => ({
      title: e.title,
      status: e.status,
      registrations: e.registered_count,
      capacity: e.capacity,
      fill_pct: e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0,
      is_free: e.is_free ? "yes" : "no",
      price: e.price ?? "0",
      start_date: e.start_date,
      end_date: e.end_date,
    }));
    downloadCsv(eventId ? `event-${eventId}-analytics.csv` : "org-analytics.csv", rows);
    toast("Export downloaded");
  }

  // rows for the top events table
  const topEvents = [...events]
    .sort((a, b) => b.registered_count - a.registered_count)
    .slice(0, 10);

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Analytics"]}
        title={singleEvent ? `Analytics - ${singleEvent.title}` : "Analytics overview"}
        sub="Registration funnels, revenue trends, cohort retention, and event performance."
        actions={
          <>
            <button className="btn-sm">
              <MS n="date_range" size={13} />
              Last 12 months
            </button>
            <button className="btn-sm" onClick={handleExport}>
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="kpi-grid">
        <KPI icon="visibility" color="lav" label="Page views" value="-" />
        <KPI icon="how_to_reg" color="pch" label="Registrations" value={kpiRegistrations} />
        <KPI icon="trending_up" color="mnt" label="Conversion" value={kpiConversion} />
        <KPI icon="star" color="crl" label="Health score" value={kpiHealthScore} />
      </div>

      {/* per-event health detail when viewing a single event */}
      {eventId && health && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <span className="panel-title">Event health</span>
          </div>
          <div
            className="panel-body"
            style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--on-var)" }}>Registration velocity</span>
              <span style={{ fontWeight: 600 }}>{health.registration_velocity.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--on-var)" }}>Engagement rate</span>
              <span style={{ fontWeight: 600 }}>{(health.engagement_rate * 100).toFixed(1)}%</span>
            </div>
            {health.risk_flags.length > 0 && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "var(--on-var)" }}>Risk flags: </span>
                <span style={{ color: "var(--secondary)", fontWeight: 500 }}>
                  {health.risk_flags.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue + registrations charts */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue - 12 months</span>
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
            Chart coming soon
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registrations - cumulative</span>
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
            {isLoading ? "Loading..." : `${kpiRegistrations} total`}
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
              Attendee retention - % returning by months after first event
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
                  <th>Fill</th>
                  <th>Free</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
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
                      Loading...
                    </td>
                  </tr>
                ) : topEvents.length === 0 ? (
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
                ) : (
                  topEvents.map((e) => {
                    const fill =
                      e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0;
                    return (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 500 }}>{e.title}</td>
                        <td>{e.registered_count}</td>
                        <td>{e.capacity}</td>
                        <td>{fill}%</td>
                        <td>{e.is_free ? "Yes" : "No"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
