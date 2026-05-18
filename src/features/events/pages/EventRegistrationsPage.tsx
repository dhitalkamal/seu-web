import { Link, useParams } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { useEvent } from "@/features/events/hooks/useEvents";

/** Organiser view of registrations for a specific event — SEU v8 design. */
export default function EventRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event } = useEvent(id ?? "");

  const filled = event ? Math.round((event.registered_count / event.capacity) * 100) : 0;

  return (
    <AppLayout
      title="Registrations"
      subtitle={event?.title}
      actions={
        <Link
          to={`/events/${id}`}
          className="no-underline text-sm font-semibold"
          style={{ color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
        >
          ← Back to event
        </Link>
      }
    >
      {/* capacity KPIs */}
      {event && (
        <div className="grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            {
              label: "Registered",
              value: event.registered_count.toLocaleString(),
              icon: "how_to_reg",
              tintBg: "#dce1ff",
              tintColor: "var(--primary)",
            },
            {
              label: "Spots left",
              value: (event.capacity - event.registered_count).toLocaleString(),
              icon: "event_seat",
              tintBg: "#d8efe2",
              tintColor: "var(--success)",
            },
            {
              label: "Fill rate",
              value: `${filled}%`,
              icon: "donut_large",
              tintBg: "#ffddae",
              tintColor: "#604100",
            },
          ].map(({ label, value, icon, tintBg, tintColor }) => (
            <div
              key={label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="grid place-items-center flex-shrink-0"
                  style={{ width: 34, height: 34, borderRadius: 9, background: tintBg }}
                >
                  <span className="ms" style={{ fontSize: 18, color: tintColor }}>
                    {icon}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-var)",
                  marginBottom: 5,
                }}
              >
                {label}
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
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* fill progress bar */}
      {event && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div className="flex justify-between mb-2">
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--on-bg)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Capacity fill
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--on-mut)",
              }}
            >
              {event.registered_count} / {event.capacity}
            </p>
          </div>
          <div
            style={{ height: 8, background: "var(--low)", borderRadius: 999, overflow: "hidden" }}
          >
            <div
              style={{
                height: "100%",
                width: `${filled}%`,
                background:
                  filled >= 90 ? "var(--secondary)" : "linear-gradient(90deg, #121d3f, #1a2a5e)",
                borderRadius: 999,
                transition: "width 400ms",
              }}
            />
          </div>
        </div>
      )}

      {/* attendee table placeholder */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--outline)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--outline)" }}>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--on-bg)",
            }}
          >
            Attendees
          </p>
        </div>
        <div className="py-16 text-center">
          <span
            className="ms"
            style={{ fontSize: 40, color: "var(--high)", display: "block", marginBottom: 12 }}
          >
            how_to_reg
          </span>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 17,
              color: "var(--on-mut)",
            }}
          >
            Registrations are managed via the participation service.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--on-mut)",
              fontFamily: "Manrope, sans-serif",
              marginTop: 6,
            }}
          >
            View check-ins and manage attendance from the check-in terminal.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
