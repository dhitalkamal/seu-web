import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import type { EventHealthScore } from "@/features/intelligence/api/intelligence.api";

/** Map a numeric score to a human-readable level and display color. */
function scoreLevel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: "critical", color: "#991b1b" };
  if (score <= 40) return { label: "at risk", color: "#e83151" };
  if (score <= 60) return { label: "moderate", color: "#dba13d" };
  if (score <= 80) return { label: "healthy", color: "#84cc16" };
  return { label: "excellent", color: "#16a34a" };
}

/** Event health page: weighted score combining fill rate, conversion, velocity, and revenue progress. */
export default function EventHealthPage() {
  const { toast, toastEl } = useToast();
  const { id: eventId } = useParams<{ id: string }>();

  // fetch health score for this event from the intelligence service
  const { data: health, isLoading, refetch } = useQuery<EventHealthScore>({
    queryKey: ["event-health", eventId],
    queryFn: () => intelligenceApi.getEventHealth(eventId!),
    enabled: !!eventId,
  });

  const level = health ? scoreLevel(health.health_score) : null;

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Event Health"]}
        title="Event health"
        sub="Weighted score combining fill rate, conversion, velocity, and revenue progress. Updated hourly."
        actions={
          <>
            <button className="btn-sm" onClick={() => refetch()}>
              <MS n="refresh" size={13} />
              Recalculate
            </button>
            <button className="btn-sm primary" onClick={() => toast("Report scheduled")}>
              <MS n="schedule_send" size={13} />
              Weekly digest
            </button>
          </>
        }
      />

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Event health overview</span>
          </div>
          <div className="panel-body">
            {isLoading && (
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
            )}
            {!isLoading && !health && (
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
            )}
            {health && level && (
              <div style={{ padding: "24px 0" }}>
                {/* score gauge */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      border: `6px solid ${level.color}`,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: 36,
                        color: level.color,
                      }}
                    >
                      {Math.round(health.health_score)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: level.color,
                      textTransform: "capitalize",
                    }}
                  >
                    {level.label}
                  </p>
                </div>

                {/* component metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    {
                      label: "Registration velocity",
                      value: health.registration_velocity.toFixed(1),
                      icon: "trending_up",
                    },
                    {
                      label: "Engagement rate",
                      value: `${(health.engagement_rate * 100).toFixed(1)}%`,
                      icon: "people",
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      style={{ padding: 14, background: "var(--low)", borderRadius: 10 }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}
                      >
                        <MS n={m.icon} size={15} style={{ color: "var(--on-mut)" }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--on-mut)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {m.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "Space Grotesk, sans-serif",
                          fontWeight: 700,
                          fontSize: 22,
                        }}
                      >
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Score formula</span>
          </div>
          <div className="panel-body">
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11.5,
                lineHeight: 1.7,
                color: "var(--on-var)",
                padding: 14,
                background: "var(--low)",
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              score =<br />
              &nbsp;&nbsp;fill_rate x 0.40
              <br />
              &nbsp;&nbsp;+ conversion x 0.30
              <br />
              &nbsp;&nbsp;+ velocity x 0.20
              <br />
              &nbsp;&nbsp;+ revenue x 0.10
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["0-20", "critical", "#991b1b"],
                ["21-40", "at risk", "#e83151"],
                ["41-60", "moderate", "#dba13d"],
                ["61-80", "healthy", "#84cc16"],
                ["81-100", "excellent", "#16a34a"],
              ].map(([range, label, color]) => (
                <div
                  key={range}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: "var(--on-mut)",
                      width: 60,
                    }}
                  >
                    {range}
                  </span>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Risk flags</span>
          </div>
          <div className="panel-body">
            {isLoading && (
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
            )}
            {!isLoading && (!health || health.risk_flags.length === 0) && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "48px 0",
                }}
              >
                No risk flags
              </p>
            )}
            {health && health.risk_flags.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0" }}>
                {health.risk_flags.map((flag, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: "#fef2f2",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#991b1b",
                    }}
                  >
                    <MS n="warning" size={15} style={{ color: "#e83151", flexShrink: 0 }} />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Health summary</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={3}
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
                )}
                {!isLoading && !health && (
                  <tr>
                    <td
                      colSpan={3}
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
                )}
                {health && level && (
                  <>
                    <tr>
                      <td>Health score</td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                        {Math.round(health.health_score)}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: `${level.color}22`,
                            color: level.color,
                            textTransform: "capitalize",
                          }}
                        >
                          {level.label}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Velocity</td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {health.registration_velocity.toFixed(1)}
                      </td>
                      <td>regs/day</td>
                    </tr>
                    <tr>
                      <td>Engagement</td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {(health.engagement_rate * 100).toFixed(1)}%
                      </td>
                      <td>rate</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
