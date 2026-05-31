import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import eventsApi from "@/features/events/api/events.api";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import apiClient from "@/shared/api/client";
import type { Event } from "@/features/events/types/event.types";

type DateRange = "30d" | "90d" | "12m" | "all";
const RANGE_LABELS: Record<DateRange, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  all: "All time",
};

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
  const [range, setRange] = useState<DateRange>("12m");
  const [showRangeMenu, setShowRangeMenu] = useState(false);

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

  // growth analytics placeholder - backend endpoint exists but is not yet registered in urls.py
  const growthData: { date: string; revenue: number; registrations: number }[] = [];
  const growthRevenue = 0;
  const growthRegs = 0;

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

  const kpiConversion = eventId ? `${eventFillPct}%` : isLoading ? "..." : `${conversionPct}%`;

  const kpiHealthScore = health != null ? health.health_score.toFixed(0) : isLoading ? "..." : "-";

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

  // fetch registrations for the selected event to compute funnel
  const { data: registrations = [] } = useQuery({
    queryKey: ["event-registrations-analytics", eventId],
    queryFn: async () => {
      const r = await apiClient.get(`/participation/api/v1/events/${eventId}/registrations/`);
      return (r.data?.data ?? []) as { id: string; status: string; checked_in_at: string | null }[];
    },
    enabled: !!eventId,
  });

  // funnel metrics from registration data
  const funnelCapacity = singleEvent?.capacity ?? 0;
  const funnelRegistered = registrations.length;
  const funnelConfirmed = registrations.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;
  const funnelCheckedIn = registrations.filter((r) => r.checked_in_at != null).length;

  // event breakdown by pricing for "revenue by category" panel
  const paidEvents = events.filter((e) => !e.is_free);
  const freeEvents = events.filter((e) => e.is_free);

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
            <div style={{ position: "relative" }}>
              <button className="btn-sm" onClick={() => setShowRangeMenu((v) => !v)}>
                <MS n="date_range" size={13} />
                {RANGE_LABELS[range]}
              </button>
              {showRangeMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    zIndex: 100,
                    background: "var(--surface)",
                    border: "1px solid var(--mid)",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    padding: 4,
                    minWidth: 160,
                  }}
                >
                  {(Object.entries(RANGE_LABELS) as [DateRange, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setRange(key);
                        setShowRangeMenu(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 12px",
                        border: "none",
                        background: range === key ? "var(--low)" : "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: range === key ? 700 : 500,
                        textAlign: "left",
                        borderRadius: 6,
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-sm" onClick={handleExport}>
              <MS n="download" size={13} />
              Export
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="kpi-grid">
        <KPI icon="event" color="lav" label="Events" value={isLoading ? "..." : events.length.toString()} trend={`${events.filter((e) => e.status === "published").length} published`} />
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
            <span className="panel-title">Revenue - {RANGE_LABELS[range].toLowerCase()}</span>
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.025em",
              }}
            >
              {eventId && growthData.length > 0
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    growthRevenue
                  )
                : "-"}
            </span>
          </div>
          <div className="panel-body" style={{ minHeight: 220, padding: "16px 20px" }}>
            {!eventId ? (
              <p
                style={{
                  color: "var(--on-mut)",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 80,
                }}
              >
                Select an event to view revenue data
              </p>
            ) : growthData.length === 0 ? (
              <p
                style={{
                  color: "var(--on-mut)",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 80,
                }}
              >
                No revenue data for this period
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {growthData.slice(-10).map((d) => (
                  <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "JetBrains Mono, monospace",
                        minWidth: 70,
                      }}
                    >
                      {d.date}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 16,
                        background: "var(--low)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${growthRevenue > 0 ? (d.revenue / growthRevenue) * 100 : 0}%`,
                          background: "var(--primary)",
                          borderRadius: 4,
                          minWidth: d.revenue > 0 ? 2 : 0,
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, minWidth: 50, textAlign: "right" }}
                    >
                      ${d.revenue.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registrations - cumulative</span>
          </div>
          <div className="panel-body" style={{ minHeight: 220, padding: "16px 20px" }}>
            {!eventId ? (
              <p
                style={{
                  color: "var(--on-mut)",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 80,
                }}
              >
                {isLoading ? "Loading..." : `${kpiRegistrations} total`}
              </p>
            ) : growthData.length === 0 ? (
              <p
                style={{
                  color: "var(--on-mut)",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 80,
                }}
              >
                No registration data for this period
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {growthData.slice(-10).map((d) => (
                  <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "JetBrains Mono, monospace",
                        minWidth: 70,
                      }}
                    >
                      {d.date}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 16,
                        background: "var(--low)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${growthRegs > 0 ? (d.registrations / growthRegs) * 100 : 0}%`,
                          background: "#16a34a",
                          borderRadius: 4,
                          minWidth: d.registrations > 0 ? 2 : 0,
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, minWidth: 30, textAlign: "right" }}
                    >
                      {d.registrations}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel / revenue by category / NPS */}
      <div className="chart-grid-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registration funnel</span>
          </div>
          <div className="panel-body" style={{ minHeight: 180, padding: "16px 20px" }}>
            {!eventId ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13, textAlign: "center", paddingTop: 60 }}>Select an event to view the funnel</p>
            ) : registrations.length === 0 ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13, textAlign: "center", paddingTop: 60 }}>No registrations yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Capacity", value: funnelCapacity, color: "var(--mid)", pct: 100 },
                  { label: "Registered", value: funnelRegistered, color: "#4338ca", pct: funnelCapacity > 0 ? (funnelRegistered / funnelCapacity) * 100 : 0 },
                  { label: "Confirmed", value: funnelConfirmed, color: "#16a34a", pct: funnelCapacity > 0 ? (funnelConfirmed / funnelCapacity) * 100 : 0 },
                  { label: "Checked in", value: funnelCheckedIn, color: "#050a26", pct: funnelCapacity > 0 ? (funnelCheckedIn / funnelCapacity) * 100 : 0 },
                ].map((stage) => (
                  <div key={stage.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>{stage.label}</span>
                      <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{stage.value} ({Math.round(stage.pct)}%)</span>
                    </div>
                    <div style={{ height: 8, background: "var(--low)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, stage.pct)}%`, background: stage.color, borderRadius: 4, transition: "width 300ms" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event breakdown</span>
          </div>
          <div className="panel-body" style={{ minHeight: 180, padding: "16px 20px" }}>
            {events.length === 0 ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13, textAlign: "center", paddingTop: 60 }}>No events yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Total events", value: events.length, icon: "event", color: "var(--primary)" },
                  { label: "Published", value: events.filter((e) => e.status === "published").length, icon: "check_circle", color: "#16a34a" },
                  { label: "Draft", value: events.filter((e) => e.status === "draft").length, icon: "edit", color: "#dba13d" },
                  { label: "Paid events", value: paidEvents.length, icon: "payments", color: "#4338ca" },
                  { label: "Free events", value: freeEvents.length, icon: "money_off", color: "var(--on-mut)" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MS n={row.icon} size={16} style={{ color: row.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event performance</span>
          </div>
          <div className="panel-body" style={{ minHeight: 180, padding: "16px 20px" }}>
            {events.length === 0 ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13, textAlign: "center", paddingTop: 60 }}>No events yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Total registrations", value: totalRegistrations.toLocaleString() },
                  { label: "Total capacity", value: totalCapacity.toLocaleString() },
                  { label: "Avg fill rate", value: `${conversionPct}%` },
                  { label: "Avg registrations/event", value: events.length > 0 ? Math.round(totalRegistrations / events.length).toString() : "0" },
                  { label: "Highest fill", value: events.length > 0 ? `${Math.max(...events.map((e) => e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0))}%` : "-" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retention heatmap + top events table */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registration status breakdown</span>
          </div>
          <div className="panel-body" style={{ minHeight: 180, padding: "16px 20px" }}>
            {!eventId || registrations.length === 0 ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13, textAlign: "center", paddingTop: 60 }}>{!eventId ? "Select an event" : "No registrations"}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(registrations.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                  const pct = registrations.length > 0 ? (count / registrations.length) * 100 : 0;
                  const color = status === "confirmed" ? "#16a34a" : status === "checked_in" ? "#050a26" : status === "cancelled" ? "#e83151" : status === "waitlisted" ? "#dba13d" : "#9ca3af";
                  return (
                    <div key={status}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--on-var)", textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</span>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div style={{ height: 8, background: "var(--low)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
