import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import { useOrgContext } from "@/features/orgs/hooks/useOrgContext";
import eventsApi from "@/features/events/api/events.api";
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
          // wrap values that contain commas or quotes
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

/** Org overview dashboard - KPIs and event table wired to real event data. */
export default function OrgDashboardPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  useOrgContext();
  const org = useOrgStore((s) => s.org);
  const loaded = useOrgStore((s) => s.loaded);

  // fetch events owned by this organiser
  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
    enabled: !!org,
  });

  const events: Event[] = eventsPage?.results ?? [];

  // compute KPIs from event data
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count ?? 0), 0);
  const activeEvents = events.filter((e) => e.status === "published");
  // revenue: sum of price * registered_count for paid events
  const totalRevenue = events.reduce((sum, e) => {
    if (e.is_free) return sum;
    const price = parseFloat(e.price ?? "0") || 0;
    return sum + price * (e.registered_count ?? 0);
  }, 0);

  /** Export dashboard KPI data as CSV. */
  function handleExport(): void {
    const rows = events.map((e) => ({
      title: e.title,
      status: e.status,
      registrations: e.registered_count,
      capacity: e.capacity,
      fill_pct: e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0,
      is_free: e.is_free ? "yes" : "no",
      price: e.price ?? "0",
      revenue: e.is_free ? 0 : (parseFloat(e.price ?? "0") || 0) * e.registered_count,
      start_date: e.start_date,
      end_date: e.end_date,
    }));
    downloadCsv("org-dashboard.csv", rows);
    toast("Export downloaded");
  }

  // loading guard - render placeholder until org store is ready
  if (!loaded) {
    return (
      <AppLayout variant="org">
        <div
          style={{
            padding: "80px 0",
            textAlign: "center",
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Loading...
        </div>
      </AppLayout>
    );
  }

  // ! Gate: org missing or not approved - hard redirect so users never see a partial dashboard
  if (!isOrgActive(org)) {
    navigate("/profile", { replace: true });
    return null;
  }

  const revenueDisplay =
    totalRevenue > 0
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalRevenue)
      : "-";

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Overview"]}
        title="Organization overview"
        sub="Workspace operations, registration health, financial performance, and team activity in real time."
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

      {/* KPI row - computed from event data */}
      <div className="kpi-grid">
        <KPI
          icon="how_to_reg"
          color="lav"
          label="Registrations"
          value={eventsLoading ? "..." : totalRegistrations.toLocaleString()}
        />
        <KPI
          icon="payments"
          color="pch"
          label="Revenue YTD"
          value={eventsLoading ? "..." : revenueDisplay}
        />
        <KPI
          icon="rocket_launch"
          color="crl"
          label="Active Events"
          value={eventsLoading ? "..." : activeEvents.length.toString()}
        />
        <KPI icon="group_add" color="nav" label="Volunteers" value="0" />
      </div>

      {/* Revenue chart + workspace integrity */}
      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue - last 12 months</span>
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.025em",
              }}
            >
              {eventsLoading ? "..." : revenueDisplay}
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
            {eventsLoading ? "Loading..." : "Chart coming soon"}
          </div>
        </div>
        <div className="depth">
          <div className="depth-ic">
            <MS n="verified_user" size={112} />
          </div>
          <h4>Workspace Integrity</h4>
          <p>
            {org?.status === "active" || org?.status === "approved"
              ? "Workspace is active and verified."
              : "Connect your workspace to see compliance status."}
          </p>
          <div className="depth-status">
            <span className="pulse" />
            {org?.status ?? "Awaiting data"}
          </div>
        </div>
      </div>

      {/* Event pipeline / mix / registrations */}
      <div className="chart-grid-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event pipeline</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "16px 20px",
              minHeight: 180,
            }}
          >
            {eventsLoading ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13 }}>Loading...</p>
            ) : events.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  paddingTop: 48,
                }}
              >
                No events yet
              </p>
            ) : (
              // group by status and show counts
              (["draft", "published", "completed", "cancelled"] as const).map((status) => {
                const count = events.filter((e) => e.status === status).length;
                if (count === 0) return null;
                return (
                  <div
                    key={status}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                  >
                    <span style={{ color: "var(--on-var)", textTransform: "capitalize" }}>
                      {status}
                    </span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event mix</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "16px 20px",
              minHeight: 180,
            }}
          >
            {eventsLoading ? (
              <p style={{ color: "var(--on-mut)", fontSize: 13 }}>Loading...</p>
            ) : events.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  paddingTop: 48,
                }}
              >
                No events yet
              </p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>Free</span>
                  <span style={{ fontWeight: 600 }}>{events.filter((e) => e.is_free).length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>Paid</span>
                  <span style={{ fontWeight: 600 }}>{events.filter((e) => !e.is_free).length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>Online</span>
                  <span style={{ fontWeight: 600 }}>
                    {events.filter((e) => e.is_online).length}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--on-var)" }}>In-person</span>
                  <span style={{ fontWeight: 600 }}>
                    {events.filter((e) => !e.is_online).length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Registrations - cumulative YTD</span>
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
            {eventsLoading
              ? "Loading..."
              : totalRegistrations > 0
                ? `${totalRegistrations.toLocaleString()} total`
                : "No registrations yet"}
          </div>
        </div>
      </div>

      {/* Active events table + audit log */}
      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Active events</span>
            <button className="btn-sm" onClick={() => navigate("/org/events")}>
              View all
            </button>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Registrations</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
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
                ) : activeEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "28px 0",
                        color: "var(--on-mut)",
                        fontSize: 13,
                      }}
                    >
                      No active events
                    </td>
                  </tr>
                ) : (
                  activeEvents.slice(0, 8).map((e) => (
                    <tr
                      key={e.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/org/events/${e.id}`)}
                    >
                      <td style={{ fontWeight: 500 }}>{e.title}</td>
                      <td>
                        {e.registered_count} / {e.capacity}
                      </td>
                      <td>{new Date(e.start_date).toLocaleDateString()}</td>
                      <td>{e.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Audit log</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No activity yet
          </div>
        </div>
      </div>

      {/* Top events by revenue + team health */}
      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Top events by revenue YTD</span>
          </div>
          <div className="panel-body flush">
            {eventsLoading ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "28px 0",
                }}
              >
                Loading...
              </p>
            ) : events.filter((e) => !e.is_free).length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "28px 0",
                }}
              >
                No paid events yet
              </p>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Registrations</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter((e) => !e.is_free)
                    .sort(
                      (a, b) =>
                        (parseFloat(b.price ?? "0") || 0) * b.registered_count -
                        (parseFloat(a.price ?? "0") || 0) * a.registered_count
                    )
                    .slice(0, 5)
                    .map((e) => {
                      const rev = (parseFloat(e.price ?? "0") || 0) * e.registered_count;
                      return (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 500 }}>{e.title}</td>
                          <td>{e.registered_count}</td>
                          <td>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(rev)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Team &amp; volunteer health</span>
          </div>
          <div
            className="panel-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              color: "var(--on-mut)",
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
