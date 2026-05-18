import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import checkinApi from "@/features/checkin/api/checkin.api";

// upcoming shifts are still empty until a separate shifts query is added
const UPCOMING_SHIFTS: {
  event: string;
  role: string;
  date: string;
  time: string;
  venue: string;
}[] = [];

// activity feed is still empty until an activity endpoint exists
const ACTIVITY: { icon: string; text: string; time: string }[] = [];

/** Volunteer overview dashboard: KPIs, next shifts, activity feed, quick links. */
export default function VolunteerHomePage() {
  const navigate = useNavigate();

  // passport gives us the events_attended count
  const { data: passport } = useQuery({
    queryKey: ["passport"],
    queryFn: checkinApi.getPassport,
  });

  const eventsServed = passport?.events_attended ?? 0;

  // KPI cards: events served is live; the rest await their own endpoints
  const KPIS = [
    {
      label: "Total Hours",
      value: "N/A",
      delta: "",
      icon: "timer",
      bg: "#dce1ff",
      color: "var(--primary)",
    },
    {
      label: "Events Served",
      value: String(eventsServed),
      delta: "",
      icon: "event_available",
      bg: "#d8efe2",
      color: "#166534",
    },
    { label: "Avg Rating", value: "N/A", delta: "", icon: "star", bg: "#ffddae", color: "#604100" },
    {
      label: "Certificates",
      value: "N/A",
      delta: "",
      icon: "workspace_premium",
      bg: "#ffdada",
      color: "var(--secondary)",
    },
  ];

  return (
    <AppLayout
      variant="user"
      title="Volunteer Dashboard"
      subtitle="Track your shifts, hours, and impact."
      crumbs={["Volunteer", "Overview"]}
    >
      {/* upcoming shifts panel */}
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

      {/* KPI cards */}
      <div className="grid mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {KPIS.map((k) => (
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
              {k.delta && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#16a34a",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {k.delta}
                </span>
              )}
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

      {/* two-column: upcoming shifts + activity feed */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 340px", gap: 18 }}>
        {/* upcoming shifts */}
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

          {UPCOMING_SHIFTS.length === 0 ? (
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
              {UPCOMING_SHIFTS.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4"
                  style={{
                    padding: "14px 20px",
                    borderTop: i > 0 ? "1px solid var(--outline)" : "none",
                  }}
                >
                  <div
                    className="grid place-items-center flex-shrink-0"
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
                      {s.role}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {s.event} / {s.date}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {s.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* activity feed */}
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

          {ACTIVITY.length === 0 ? (
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
              <p
                style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                No activity yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {ACTIVITY.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3"
                  style={{
                    padding: "12px 20px",
                    borderTop: i > 0 ? "1px solid var(--outline)" : "none",
                  }}
                >
                  <span
                    className="ms"
                    style={{ fontSize: 16, color: "var(--on-mut)", marginTop: 2, flexShrink: 0 }}
                  >
                    {a.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "var(--on-bg)",
                        fontFamily: "Manrope, sans-serif",
                        lineHeight: 1.4,
                      }}
                    >
                      {a.text}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      {a.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

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
