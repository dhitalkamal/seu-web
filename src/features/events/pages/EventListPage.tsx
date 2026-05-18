import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import type { Event } from "@/features/events/types/event.types";

// * Simple category labels (no fake counts — counts come from API if needed)
const CATEGORIES: [string, string][] = [
  ["all", "All"],
  ["summit", "Summits"],
  ["workshop", "Workshops"],
  ["gala", "Galas"],
  ["lecture", "Lectures"],
  ["symposium", "Symposia"],
];

/**
 * Calculates the capacity-fill percentage for a given event.
 * @param ev - the event to check
 * @returns fill percentage 0–100
 */
function fillPercent(ev: Event): number {
  if (ev.capacity <= 0) return 0;
  return (ev.registered_count / ev.capacity) * 100;
}

/**
 * Formats a date string into a short display label, e.g. "OCT 12".
 * @param iso - ISO date string
 * @returns uppercase short date
 */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${d.getDate()}`;
}

/** Discover events — live data, featured hero, category filter, event grid. */
export default function EventListPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const [cat, setCat] = useState("all");

  const { data, isLoading } = usePublicEvents(cat === "all" ? undefined : { category: cat });
  const events = data?.results ?? [];
  const featured = events.length > 0 ? events[0] : null;

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Discover"]}
        title="Discover programmes"
        sub="Browse upcoming events across the platform."
        actions={
          <>
            <button className="btn-sm">
              <MS n="filter_alt" size={13} />
              Filter
            </button>
            <button className="btn-sm">
              <MS n="event" size={13} />
              Calendar view
            </button>
          </>
        }
      />

      {/* category chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map(([k, l]) => (
          <button
            key={k}
            className={`aud-chip${cat === k ? " on" : ""}`}
            onClick={() => setCat(k)}
            style={{ margin: 0 }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* featured hero */}
      {isLoading ? (
        <div
          className="animate-pulse"
          style={{ height: 240, borderRadius: 16, marginBottom: 24, background: "var(--surface)" }}
        />
      ) : featured ? (
        <div
          style={{
            background: "linear-gradient(135deg,#050a26,#121d3f)",
            borderRadius: 16,
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            minHeight: 240,
            cursor: "pointer",
          }}
          onClick={() => navigate(`/events/${featured.id}`)}
        >
          <div
            style={{
              padding: "32px 36px",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--tertiary)",
                marginBottom: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 1,
                  background: "var(--tertiary)",
                  display: "inline-block",
                }}
              />
              Featured this week
            </span>
            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 500,
                fontSize: 34,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                marginBottom: 12,
              }}
            >
              {featured.title}
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 18,
                maxWidth: "48ch",
                lineHeight: 1.55,
              }}
            >
              {featured.location} &middot; {shortDate(featured.start_date)}.{" "}
              {featured.registered_count.toLocaleString()} attending.{" "}
              {(featured.capacity - featured.registered_count).toLocaleString()} spots left.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-sm primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${featured.id}`);
                }}
              >
                {featured.is_free
                  ? "Register · Free"
                  : `Register · NPR ${parseFloat(featured.price).toLocaleString()}`}
              </button>
              <button
                className="btn-sm"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toast("Saved");
                }}
              >
                <MS n="bookmark_add" size={13} />
                Save
              </button>
            </div>
          </div>
          <div
            style={{ background: "linear-gradient(135deg,#1a2750,#050a26)", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg,#121d3f,transparent 30%)",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className="text-center py-16"
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            marginBottom: 24,
            border: "1px solid var(--outline)",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--on-mut)",
            }}
          >
            No events found.
          </p>
        </div>
      )}

      {/* event grid */}
      {isLoading ? (
        <div className="disc-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ height: 300, borderRadius: 16, background: "var(--surface)" }}
            />
          ))}
        </div>
      ) : (
        <div className="disc-grid">
          {events.map((ev) => {
            const f = fillPercent(ev);
            const priceLabel = ev.is_free ? "Free" : `NPR ${parseFloat(ev.price).toLocaleString()}`;
            return (
              <div key={ev.id} className="disc-card" onClick={() => navigate(`/events/${ev.id}`)}>
                <div
                  className="disc-hero"
                  style={{ background: "linear-gradient(135deg,#1a2750,#050a26)" }}
                >
                  <span className="disc-date">{shortDate(ev.start_date)}</span>
                  {f > 85 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1,
                        background: "#e83151",
                        color: "white",
                        padding: "3px 9px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "JetBrains Mono, monospace",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Filling fast
                    </span>
                  )}
                </div>
                <div className="disc-body">
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 9.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--secondary)",
                      fontWeight: 700,
                    }}
                  >
                    {ev.status}
                  </div>
                  <div className="disc-title">{ev.title}</div>
                  <div className="disc-meta">
                    {ev.location} &middot; {ev.registered_count.toLocaleString()} attending
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "var(--mid)",
                      borderRadius: 999,
                      overflow: "hidden",
                      margin: "4px 0 2px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${f}%`,
                        background: f > 85 ? "#e83151" : f > 60 ? "#dba13d" : "#16a34a",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div className="disc-foot">
                    <span className="disc-price">{priceLabel}</span>
                    <button
                      className="btn-sm primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${ev.id}`);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
