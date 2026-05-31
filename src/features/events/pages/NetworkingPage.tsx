import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS } from "@/shared/components/v8";
import registrationApi from "@/features/registration/api/registration.api";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";

/** format a date string to short label */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Networking landing page. Shows events where the user registered with
 * networking enabled. Clicking an event card opens the Who to Meet page.
 */
export default function NetworkingPage() {
  // all user registrations
  const { data: registrations = [], isLoading: regsLoading } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationApi.listMine(),
  });

  // only confirmed/checked-in registrations with networking on
  const networkingRegs = registrations.filter(
    (r) => r.networking_opt_in === true && (r.status === "confirmed" || r.status === "checked_in")
  );

  // all confirmed registrations (for the "all events" fallback section)
  const allActiveRegs = registrations.filter(
    (r) => r.status === "confirmed" || r.status === "checked_in"
  );
  const nonNetworkingRegs = allActiveRegs.filter((r) => !r.networking_opt_in);

  // fetch public events to get titles and dates
  const { data: eventsData } = useQuery({
    queryKey: ["events", "public"],
    queryFn: () => eventsApi.listPublicEvents(),
  });
  const eventsMap = new Map<string, Event>((eventsData?.results ?? []).map((e) => [e.id, e]));

  const isLoading = regsLoading;

  return (
    <AppLayout variant="user">
      <PH
        crumbs={["Connect", "Networking"]}
        title="Who to Meet"
        sub="AI-powered attendee matching for your registered events."
      />

      {/* hero */}
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
          Our AI analyzes shared event history to rank who you should meet. Enable networking when
          registering for an event, then click below to see your matches.
        </p>
      </div>

      {/* networking-enabled events */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <span className="panel-title">Networking enabled</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
            }}
          >
            {networkingRegs.length} event{networkingRegs.length !== 1 ? "s" : ""}
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
              Loading...
            </div>
          ) : networkingRegs.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <MS
                n="diversity_3"
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
                No networking events yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  marginBottom: 16,
                }}
              >
                Enable networking when registering for an event to get matched with attendees.
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
              {networkingRegs.map((reg) => {
                const ev = eventsMap.get(reg.event_id);
                return (
                  <_EventCard
                    key={reg.id}
                    eventId={reg.event_id}
                    title={ev?.title}
                    date={ev?.start_date}
                    location={ev?.location}
                    networkingOn
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* other registered events without networking */}
      {nonNetworkingRegs.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Other registered events</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              networking off
            </span>
          </div>
          <div className="panel-body flush">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                padding: 16,
              }}
            >
              {nonNetworkingRegs.map((reg) => {
                const ev = eventsMap.get(reg.event_id);
                return (
                  <_EventCard
                    key={reg.id}
                    eventId={reg.event_id}
                    title={ev?.title}
                    date={ev?.start_date}
                    location={ev?.location}
                    networkingOn={false}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/** clickable event card that links to the connections page */
function _EventCard({
  eventId,
  title,
  date,
  location,
  networkingOn,
}: {
  eventId: string;
  title?: string;
  date?: string;
  location?: string;
  networkingOn: boolean;
}) {
  return (
    <Link
      to={`/events/${eventId}/connections`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 14,
        border: `1px solid ${networkingOn ? "#c7d2fe" : "var(--outline)"}`,
        background: networkingOn ? "rgba(99,102,241,0.04)" : "var(--surface)",
        textDecoration: "none",
        color: "var(--on-bg)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#4338ca";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(67,56,202,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = networkingOn
          ? "#c7d2fe"
          : "var(--outline)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: networkingOn ? "#ede9fe" : "var(--low)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <MS
          n={networkingOn ? "diversity_3" : "event"}
          size={22}
          style={{ color: networkingOn ? "#4338ca" : "var(--on-mut)" }}
        />
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
          {title ?? `Event ${eventId?.slice(0, 8) ?? "..."}`}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
          {date && (
            <span
              style={{
                fontSize: 11.5,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <MS n="calendar_today" size={11} />
              {fmtDate(date)}
            </span>
          )}
          {location && (
            <span
              style={{
                fontSize: 11.5,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <MS n="location_on" size={11} />
              {location}
            </span>
          )}
        </div>
      </div>
      {networkingOn && (
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            background: "#dcfce7",
            color: "#166534",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "JetBrains Mono, monospace",
            flexShrink: 0,
          }}
        >
          ON
        </span>
      )}
      <MS n="arrow_forward" size={18} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
    </Link>
  );
}
