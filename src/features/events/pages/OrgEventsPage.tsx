import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { useMyEvents, useEventMutations } from "@/features/events/hooks/useEvents";
import type { Event } from "@/features/events/types/event.types";

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  draft: { bg: "var(--low)", color: "var(--on-var)" },
  published: { bg: "#dcfce7", color: "#16a34a" },
  cancelled: { bg: "rgba(232,49,81,0.1)", color: "var(--secondary)" },
  completed: { bg: "rgba(18,29,63,0.08)", color: "var(--primary)" },
};

/** Organiser event management dashboard — SEU v8 app shell + table. */
export default function OrgEventsPage() {
  const { data, isLoading } = useMyEvents();
  const events = data?.results ?? [];

  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;
  const totalReg = events.reduce((s, e) => s + e.registered_count, 0);

  const createAction = (
    <Link
      to="/events/create"
      className="inline-flex items-center gap-1.5 text-white no-underline font-semibold"
      style={{
        padding: "8px 16px",
        borderRadius: 9,
        background: "linear-gradient(135deg, #050a26, #121d3f)",
        fontSize: 13,
        fontFamily: "Manrope, sans-serif",
      }}
    >
      <span className="ms" style={{ fontSize: 16 }}>add</span>
      New event
    </Link>
  );

  return (
    <AppLayout title="My events" subtitle="Manage all your events and registrations." actions={createAction}>
      {/* KPI row */}
      <div
        className="grid mb-6"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
      >
        {[
          { label: "Total events", value: events.length, icon: "event", tint: "lav" },
          { label: "Published", value: published, icon: "public", tint: "mnt" },
          { label: "Total registrations", value: totalReg.toLocaleString(), icon: "how_to_reg", tint: "pch" },
        ].map(({ label, value, icon, tint }) => {
          const tints: Record<string, { bg: string; color: string }> = {
            lav: { bg: "#dce1ff", color: "var(--primary)" },
            mnt: { bg: "#d8efe2", color: "var(--success)" },
            pch: { bg: "#ffddae", color: "#604100" },
          };
          const { bg, color } = tints[tint];
          return (
            <div
              key={label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div
                  className="grid place-items-center"
                  style={{ width: 34, height: 34, borderRadius: 9, background: bg }}
                >
                  <span className="ms" style={{ fontSize: 18, color }}>{icon}</span>
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
          );
        })}
      </div>

      {/* events table */}
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
              color: "var(--on-bg)",
            }}
          >
            All events
          </p>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "var(--on-mut)",
              letterSpacing: "0.08em",
            }}
          >
            {events.length} TOTAL · {drafts} DRAFTS
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: 44, borderRadius: 8, background: "var(--low)" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "var(--on-mut)" }}>
              No events yet. Create your first one.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--low)" }}>
              <tr>
                {["Event", "Date", "Registered", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--on-var)",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}

function EventRow({ event }: { event: Event }) {
  const navigate = useNavigate();
  const { publishMutation, deleteMutation } = useEventMutations();
  const chip = STATUS_CHIP[event.status] ?? STATUS_CHIP.draft;

  return (
    <tr
      style={{ borderTop: "1px solid var(--outline)", cursor: "pointer" }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <td style={{ padding: "12px 16px" }}>
        <div className="flex items-center gap-3">
          <div
            className="grid place-items-center flex-shrink-0 font-bold text-white"
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "linear-gradient(135deg, var(--low), var(--mid))",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: "var(--primary)",
            }}
          >
            {event.title.charAt(0)}
          </div>
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--on-bg)", fontFamily: "Manrope, sans-serif" }}>
            {event.title}
          </p>
        </div>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
        {event.registered_count} / {event.capacity}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 9px",
            borderRadius: 999,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: chip.bg,
            color: chip.color,
          }}
        >
          {event.status}
        </span>
      </td>
      <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/events/${event.id}/edit`)}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--outline)", background: "white", fontSize: 12, fontFamily: "Manrope, sans-serif", cursor: "pointer", fontWeight: 600, color: "var(--on-bg)" }}
          >
            Edit
          </button>
          {event.status === "draft" && (
            <button
              onClick={() => publishMutation.mutate(event.id)}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "linear-gradient(135deg, #050a26, #121d3f)", fontSize: 12, fontFamily: "Manrope, sans-serif", cursor: "pointer", fontWeight: 600, color: "white" }}
            >
              {publishMutation.isPending && publishMutation.variables === event.id ? "…" : "Publish"}
            </button>
          )}
          <button
            onClick={() => deleteMutation.mutate(event.id)}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #fecaca", background: "#fee2e2", fontSize: 12, fontFamily: "Manrope, sans-serif", cursor: "pointer", fontWeight: 600, color: "#991b1b" }}
          >
            {deleteMutation.isPending && deleteMutation.variables === event.id ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}
