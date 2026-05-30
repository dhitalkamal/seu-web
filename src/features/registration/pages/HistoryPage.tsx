import { useState, useEffect } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useMyRegistrations } from "@/features/registration/hooks/useRegistrations";
import type { Registration } from "@/features/registration/types";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";
import { useMutation } from "@tanstack/react-query";

/**
 * Formats an ISO date string to "Mon DD, YYYY".
 * @param dateStr - ISO date string.
 * @returns human-readable date.
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Groups past registrations by year and returns yearly counts sorted ascending.
 * @param regs - array of past registrations.
 * @returns array of { y: string; v: number } for chart rendering.
 */
function buildYearlyCounts(regs: Registration[]): { y: string; v: number }[] {
  const counts: Record<string, number> = {};
  for (const r of regs) {
    const year = new Date(r.created_at).getFullYear().toString();
    counts[year] = (counts[year] ?? 0) + 1;
  }
  const years = Object.keys(counts).sort();
  return years.map((y) => ({ y, v: counts[y] }));
}

// * label options for the review highlights picker
const HIGHLIGHT_OPTS = [
  "Great speakers",
  "Good networking",
  "Well organized",
  "Venue was great",
  "Learned a lot",
];

/**
 * Inline review modal - lets attendees rate a checked-in event.
 * @param eventId - UUID of the event to review.
 * @param onClose - callback to dismiss the modal.
 */
function ReviewModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const submitMutation = useMutation({
    mutationFn: () => eventsApi.submitReview(eventId, { rating, highlights, note }),
    onSuccess: () => {
      toast("Review submitted");
      onClose();
    },
    onError: () => toast("Could not submit review"),
  });

  /** Toggle a highlight tag on or off. */
  function toggleHighlight(label: string) {
    setHighlights((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 400,
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 18,
          }}
        >
          Rate this event
        </div>

        {/* star selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: 28,
                color: n <= rating ? "#f59e0b" : "var(--mid)",
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* highlight chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {HIGHLIGHT_OPTS.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleHighlight(opt)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: highlights.includes(opt) ? "none" : "1px solid var(--mid)",
                background: highlights.includes(opt) ? "#050a26" : "transparent",
                color: highlights.includes(opt) ? "white" : "var(--on-var)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any comments? (optional)"
          rows={3}
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid var(--mid)",
            background: "var(--low)",
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "Manrope, sans-serif",
            color: "var(--on-bg)",
            outline: "none",
            resize: "vertical",
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-sm primary"
            style={{ flex: 1, justifyContent: "center" }}
            disabled={rating === 0 || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            <MS n="star" size={13} />
            {submitMutation.isPending ? "Submitting..." : "Submit review"}
          </button>
          <button className="btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Past events page - shows completed/cancelled registrations with bar chart and history table. */
export default function HistoryPage() {
  const { toast, toastEl } = useToast();
  const { data: registrations, isLoading } = useMyRegistrations();
  const [reviewFor, setReviewFor] = useState<string | null>(null);

  // * event detail cache keyed by event_id (issue 25)
  const [eventCache, setEventCache] = useState<Record<string, Event>>({});

  // * Past = checked_in, cancelled, no_show (i.e. non-active)
  const past: Registration[] = (registrations ?? []).filter(
    (r) => r.status === "checked_in" || r.status === "cancelled" || r.status === "no_show"
  );

  // * fetch event details for each unique event_id in past registrations
  useEffect(() => {
    const uniqueIds = [...new Set(past.map((r) => r.event_id))];
    for (const id of uniqueIds) {
      if (eventCache[id]) continue;
      eventsApi
        .getEvent(id)
        .then((res) => {
          const ev = "data" in res ? res.data : (res as unknown as Event);
          if (ev) setEventCache((prev) => ({ ...prev, [id]: ev }));
        })
        .catch(() => {
          // leave cache empty; UI falls back to truncated UUID
        });
    }
    // only re-run when the set of past registration event IDs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past.map((r) => r.event_id).join(",")]);

  const byYear = buildYearlyCounts(past);
  const maxCount = Math.max(1, ...byYear.map((y) => y.v));
  const totalAttended = past.length;

  // * Unique event IDs as a rough "institutions" / "events" count
  const uniqueEvents = new Set(past.map((r) => r.event_id)).size;

  return (
    <AppLayout variant="user">
      {toastEl}
      {/* review modal */}
      {reviewFor && <ReviewModal eventId={reviewFor} onClose={() => setReviewFor(null)} />}
      <PH
        crumbs={["Past Events"]}
        title="Past events"
        sub="Every programme you've attended."
        actions={
          <button className="btn-sm" onClick={() => toast("Year in review coming soon")}>
            <MS n="auto_awesome" size={13} />
            Year in review
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI
          icon="event_available"
          color="lav"
          label="Attended"
          value={totalAttended > 0 ? String(totalAttended) : "-"}
        />
        <KPI icon="payments" color="pch" label="Total spent" value="-" />
        <KPI
          icon="domain"
          color="mnt"
          label="Unique events"
          value={uniqueEvents > 0 ? String(uniqueEvents) : "-"}
        />
        <KPI icon="star" color="crl" label="Avg rating given" value="-" />
      </div>

      {isLoading && (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--on-mut)" }}>
          Loading history...
        </div>
      )}

      {!isLoading && past.length === 0 && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <MS n="history" size={32} />
          <div
            style={{ marginTop: 12, fontWeight: 600, fontSize: 16, fontFamily: "Space Grotesk" }}
          >
            No past events yet
          </div>
          <div style={{ color: "var(--on-mut)", fontSize: 13, marginTop: 4 }}>
            Events you have attended will appear here.
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="chart-grid-2">
          {/* yearly attendance bar chart */}
          {byYear.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Attendance by year</span>
              </div>
              <div
                className="panel-body"
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-end",
                  padding: "22px 24px 18px",
                }}
              >
                {byYear.map((y, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Space Grotesk",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "-0.025em",
                        color: y.v > 0 ? "var(--on-bg)" : "var(--on-mut)",
                      }}
                    >
                      {y.v || "-"}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 80,
                        background: "var(--low)",
                        borderRadius: 6,
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${(y.v / maxCount) * 100}%`,
                          background:
                            y.v === maxCount ? "#e83151" : y.v > 0 ? "#050a26" : "transparent",
                          borderRadius: "5px 5px 0 0",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 10,
                        color: "var(--on-mut)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {y.y}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {past.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All past registrations</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Registration code</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {past.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                      {r.registration_code}
                    </td>
                    {/* show event title if fetched, else short UUID (issue 25) */}
                    <td>
                      {eventCache[r.event_id]
                        ? eventCache[r.event_id].title
                        : r.event_id.slice(0, 8)}
                    </td>
                    <td>
                      <span
                        className={`pill ${r.status === "checked_in" ? "active" : r.status === "cancelled" ? "muted" : "draft"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{r.quantity}</td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {fmtDate(r.created_at)}
                    </td>
                    <td>
                      {r.status === "checked_in" && (
                        <button
                          className="btn-sm"
                          style={{ fontSize: 11 }}
                          onClick={() => setReviewFor(r.event_id)}
                        >
                          <MS n="star_rate" size={12} />
                          Rate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
