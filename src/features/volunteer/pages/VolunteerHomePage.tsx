import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import checkinApi from "@/features/checkin/api/checkin.api";

// * types

type Shift = {
  id: string;
  event_name?: string;
  role?: string;
  start_time?: string;
  end_time?: string;
};

/**
 * Compute hours from two ISO datetime strings.
 *
 * @param start - shift start ISO string
 * @param end - shift end ISO string
 * @returns hours as decimal, 0 if inputs are invalid
 */
function computeHours(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.round((ms / 3_600_000) * 10) / 10;
}

// * component

/** Volunteer overview dashboard: KPIs, next shifts, quick links. */
export default function VolunteerHomePage() {
  const navigate = useNavigate();

  // passport gives us events_attended count
  const { data: passport } = useQuery({
    queryKey: ["passport"],
    queryFn: checkinApi.getPassport,
  });

  // volunteer shifts for upcoming list and total hours computation
  const { data: rawShifts = [] } = useQuery({
    queryKey: ["volunteer-shifts"],
    queryFn: checkinApi.getVolunteerShifts,
  });

  const shifts = rawShifts as Shift[];

  const eventsServed = passport?.events_attended ?? 0;

  // total hours summed across all shifts with both start and end times
  const totalHours = shifts.reduce((sum, s) => sum + computeHours(s.start_time, s.end_time), 0);

  // upcoming shifts are those with a start_time in the future
  const now = Date.now();
  const upcomingShifts = shifts
    .filter((s) => s.start_time && new Date(s.start_time).getTime() > now)
    .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());

  const kpis = [
    {
      label: "Total Hours",
      value: totalHours > 0 ? `${totalHours}h` : "0h",
      icon: "timer",
      bg: "#dce1ff",
      color: "var(--primary)",
    },
    {
      label: "Events Served",
      value: String(eventsServed),
      icon: "event_available",
      bg: "#d8efe2",
      color: "#166534",
    },
    { label: "Avg Rating", value: "N/A", icon: "star", bg: "#ffddae", color: "#604100" },
    {
      label: "Certificates",
      value: "N/A",
      icon: "workspace_premium",
      bg: "#ffdada",
      color: "var(--secondary)",
    },
  ];

  return (
    <AppLayout
      variant="volunteer"
      title="Volunteer Dashboard"
      subtitle="Track your shifts, hours, and impact."
      crumbs={["Volunteer", "Overview"]}
    >
      {/* next shift highlight when shifts exist */}
      {upcomingShifts.length > 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">Next shift</span>
          </div>
          <div
            className="panel-body"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}
          >
            <div
              className="grid place-items-center shrink-0"
              style={{ width: 40, height: 40, borderRadius: 10, background: "#dbeafe" }}
            >
              <span className="ms" style={{ fontSize: 20, color: "#1e40af" }}>
                event
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  color: "var(--on-bg)",
                }}
              >
                {upcomingShifts[0].role ?? "Volunteer shift"}
              </p>
              <p
                style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                {upcomingShifts[0].event_name ?? "Event"} /{" "}
                {upcomingShifts[0].start_time
                  ? new Date(upcomingShifts[0].start_time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "TBD"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* empty upcoming shifts prompt */}
      {upcomingShifts.length === 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">Upcoming shifts</span>
          </div>
          <div className="panel-body" style={{ textAlign: "center", padding: "32px 20px" }}>
            <span
              className="ms"
              style={{
                fontSize: 40,
                color: "var(--on-mut)",
                display: "block",
                marginBottom: 12,
                opacity: 0.3,
              }}
            >
              schedule
            </span>
            <p
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 600,
                fontSize: 17,
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              No upcoming shifts
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                marginBottom: 18,
              }}
            >
              Browse open volunteer roles and apply to start making an impact.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn-sm"
                onClick={() => navigate("/volunteer-apps")}
                style={{ padding: "10px 20px" }}
              >
                <MS n="search" size={14} />
                Browse Roles
              </button>
              <button
                className="btn-sm"
                onClick={() => navigate("/volunteer/shifts")}
                style={{ padding: "10px 20px" }}
              >
                <MS n="schedule" size={14} />
                My Shifts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="grid place-items-center"
                style={{ width: 36, height: 36, borderRadius: 9, background: k.bg }}
              >
                <span className="ms" style={{ fontSize: 20, color: k.color }}>
                  {k.icon}
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--on-var)",
                marginBottom: 4,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: "-0.035em",
                color: "var(--primary)",
                lineHeight: 1,
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* two-column: upcoming shifts + quick links */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 340px", gap: 18 }}>
        {/* upcoming shifts list */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--outline)" }}
          >
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-0.02em",
              }}
            >
              Upcoming Shifts
            </p>
            <Link
              to="/volunteer/shifts"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                fontFamily: "Manrope, sans-serif",
                textDecoration: "none",
              }}
            >
              View all
            </Link>
          </div>

          {upcomingShifts.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <span
                className="ms"
                style={{
                  fontSize: 32,
                  color: "var(--on-mut)",
                  opacity: 0.4,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                event_busy
              </span>
              <p
                style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                No upcoming shifts
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  marginTop: 4,
                }}
              >
                Apply for roles to get assigned shifts.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {upcomingShifts.slice(0, 5).map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4"
                  style={{
                    padding: "14px 20px",
                    borderTop: i > 0 ? "1px solid var(--outline)" : "none",
                  }}
                >
                  <div
                    className="grid place-items-center shrink-0"
                    style={{ width: 40, height: 40, borderRadius: 10, background: "#dbeafe" }}
                  >
                    <span className="ms" style={{ fontSize: 20, color: "#1e40af" }}>
                      event
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "Manrope, sans-serif",
                        color: "var(--on-bg)",
                      }}
                    >
                      {s.role ?? "Volunteer shift"}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {s.event_name ?? "Event"} /{" "}
                      {s.start_time
                        ? new Date(s.start_time).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "TBD"}
                    </p>
                  </div>
                  {s.start_time && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {new Date(s.start_time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* quick links sidebar */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            overflow: "hidden",
            alignSelf: "flex-start",
          }}
        >
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--outline)" }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-0.02em",
              }}
            >
              Recent Activity
            </p>
          </div>

          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <span
              className="ms"
              style={{
                fontSize: 32,
                color: "var(--on-mut)",
                opacity: 0.4,
                display: "block",
                marginBottom: 8,
              }}
            >
              history
            </span>
            <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
              No activity yet
            </p>
          </div>

          {/* quick links */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--outline)" }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--on-mut)",
                marginBottom: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Quick links
            </p>
            <div className="flex flex-col gap-2">
              {[
                { to: "/volunteer/training", icon: "school", label: "Continue training" },
                { to: "/volunteer/hours", icon: "timer", label: "Log hours" },
                {
                  to: "/volunteer/certificates",
                  icon: "workspace_premium",
                  label: "My certificates",
                },
              ].map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="flex items-center gap-3"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    textDecoration: "none",
                    background: "var(--low)",
                  }}
                >
                  <span className="ms" style={{ fontSize: 15, color: "var(--on-mut)" }}>
                    {q.icon}
                  </span>
                  {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
