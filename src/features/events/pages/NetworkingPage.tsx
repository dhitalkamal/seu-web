import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS } from "@/shared/components/v8";
import checkinApi from "@/features/checkin/api/checkin.api";

/**
 * Networking landing - shows the user's registered events so they can
 * tap through to the per-event "Who to Meet" connections page.
 */
export default function NetworkingPage() {
  const { data: passport, isLoading } = useQuery({
    queryKey: ["passport"],
    queryFn: checkinApi.getPassport,
  });

  // passport.registrations is the list of event registrations the user has
  const active = (passport?.registrations ?? []) as {
    id: string;
    event_id: string;
    event_title?: string;
    event_start_date?: string;
    status: string;
  }[];

  return (
    <AppLayout variant="user">
      <PH
        crumbs={["Connect", "Networking"]}
        title="Who to Meet"
        sub="AI-powered attendee matching for your registered events."
      />

      {/* hero CTA */}
      <div
        style={{
          background: "linear-gradient(135deg, #312e81, #4338ca)",
          color: "white",
          borderRadius: 18,
          padding: "28px 32px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -20,
            bottom: -20,
            color: "rgba(255,255,255,0.06)",
            transform: "rotate(12deg)",
          }}
        >
          <span className="ms" style={{ fontSize: 140 }}>
            diversity_3
          </span>
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#c7d2fe",
            marginBottom: 10,
          }}
        >
          Smart networking
        </p>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.03em",
            marginBottom: 6,
            position: "relative",
          }}
        >
          Meet the right people at every event
        </p>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.6,
            maxWidth: 600,
            position: "relative",
          }}
        >
          Our AI analyzes shared event history to rank who you should meet. Opt in on any event
          below to see your personalized matches and send introductions.
        </p>
      </div>

      {/* events grid */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Your events</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
            }}
          >
            {active.length} registered
          </span>
        </div>
        <div className="panel-body flush">
          {isLoading ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Loading your events...
            </div>
          ) : active.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <MS
                n="event_busy"
                size={32}
                style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }}
              />
              <p
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                No registered events
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  marginBottom: 16,
                }}
              >
                Register for an event to start networking with other attendees.
              </p>
              <Link
                to="/events"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "#111",
                  color: "#fff",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <MS n="explore" size={15} />
                Browse Events
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                padding: 16,
              }}
            >
              {active.map(
                (reg: {
                  id: string;
                  event_id: string;
                  event_title?: string;
                  event_start_date?: string;
                }) => (
                  <Link
                    key={reg.id}
                    to={`/events/${reg.event_id}/connections`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 18px",
                      borderRadius: 14,
                      border: "1px solid var(--outline)",
                      background: "var(--surface)",
                      textDecoration: "none",
                      color: "var(--on-bg)",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)";
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: "#ede9fe",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MS n="diversity_3" size={22} style={{ color: "#4338ca" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          fontSize: 14,
                          letterSpacing: "-0.02em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reg.event_title ?? `Event ${reg.event_id.slice(0, 8)}`}
                      </p>
                      {reg.event_start_date && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--on-mut)",
                            fontFamily: "Manrope, sans-serif",
                            marginTop: 2,
                          }}
                        >
                          {new Date(reg.event_start_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <MS
                      n="arrow_forward"
                      size={18}
                      style={{ color: "var(--on-mut)", flexShrink: 0 }}
                    />
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
