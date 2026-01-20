import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";

// * ─── Types ──────────────────────────────────────────────────────────────────

/** Saved event shape — will come from API once the backend endpoint exists. */
type SavedEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  image_url: string;
  is_free: boolean;
  price: number;
  capacity: number;
  registered_count: number;
};

// TODO: replace with real API hook once the saved-events endpoint is wired
/** Placeholder — no saved events by default. */
const SAVED: SavedEvent[] = [];

/**
 * Formats an ISO date into a short human-readable label.
 * @param iso - ISO date string
 * @returns "Oct 12, 2026" format
 */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// * ─── Page ───────────────────────────────────────────────────────────────────

/** Saved / wishlisted events page — shows bookmarked events the user plans to attend. */
export default function SavedEventsPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const [saved] = useState<SavedEvent[]>(SAVED);

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["My Events", "Saved"]}
        title="Saved events"
        sub="Events you've bookmarked for later."
      />

      {/* empty state */}
      {saved.length === 0 && (
        <div className="panel" style={{ padding: "56px 28px", textAlign: "center" }}>
          <span
            className="ms"
            style={{
              fontSize: 40,
              color: "var(--on-mut)",
              opacity: 0.4,
              display: "block",
              marginBottom: 14,
            }}
          >
            bookmark_border
          </span>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 8,
            }}
          >
            No saved events yet
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.55,
              maxWidth: 380,
              margin: "0 auto 24px",
            }}
          >
            When you bookmark events while browsing, they'll show up here so you can easily find
            them later.
          </p>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              color: "white",
              fontFamily: "Manrope, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MS n="explore" size={15} />
            Browse Events
          </button>
        </div>
      )}

      {/* saved event grid */}
      {saved.length > 0 && (
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
        >
          {saved.map((ev) => (
            <div
              key={ev.id}
              className="panel"
              style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
              onClick={() => navigate(`/events/${ev.id}`)}
            >
              {/* image banner */}
              <div
                style={{
                  height: 140,
                  background: ev.image_url
                    ? `url(${ev.image_url}) center/cover`
                    : "linear-gradient(135deg, #050a26, #121d3f)",
                  position: "relative",
                }}
              >
                {/* unsave button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast("Removed from saved");
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <span className="ms" style={{ fontSize: 18, color: "#fbbf24" }}>
                    bookmark
                  </span>
                </button>

                {/* price badge */}
                <span
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: ev.is_free ? "rgba(34,197,94,0.9)" : "rgba(5,10,38,0.85)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {ev.is_free ? "FREE" : `NPR ${ev.price}`}
                </span>
              </div>

              {/* details */}
              <div style={{ padding: 16 }}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: "-0.02em",
                    color: "var(--on-bg)",
                    marginBottom: 6,
                    lineHeight: 1.25,
                  }}
                >
                  {ev.title}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    className="flex items-center gap-2"
                    style={{
                      fontSize: 12,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 14, color: "var(--on-mut)" }}>
                      calendar_today
                    </span>
                    {fmtDate(ev.date)}
                  </span>
                  <span
                    className="flex items-center gap-2"
                    style={{
                      fontSize: 12,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 14, color: "var(--on-mut)" }}>
                      location_on
                    </span>
                    {ev.location}
                  </span>
                </div>

                {/* capacity bar */}
                <div
                  style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--outline)" }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {ev.registered_count}/{ev.capacity} spots
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {Math.round((ev.registered_count / ev.capacity) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: "var(--low)", borderRadius: 999 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (ev.registered_count / ev.capacity) * 100)}%`,
                        background: "var(--primary)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
