import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS } from "@/shared/components/v8";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";

/** Pre-written suggestions shown before the user types anything. */
const SUGGESTIONS = [
  "Tech",
  "Music",
  "Workshop",
  "Networking",
  "Leadership",
  "Kathmandu",
];

/** Formats an ISO date string into a short label like "Jun 15, 2026". */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Search page - queries the event-service and renders matching event cards. */
export default function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [q, setQ] = useState(initial);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["event-search", q],
    queryFn: () => eventsApi.listPublicEvents({ search: q }),
    enabled: q.trim().length > 0,
  });

  const results: Event[] = data?.results ?? [];

  /** Commit the current input as the active search query. */
  function handleSearch() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setQ(trimmed);
    setParams({ q: trimmed });
  }

  return (
    <AppLayout variant="user">
      <PH
        crumbs={["Discover", "Search"]}
        title="Search events"
        sub="Find events by name, location, or keyword."
      />

      {/* search box */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-body">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <MS n="search" size={20} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
            <input
              className="field-in"
              style={{
                flex: 1,
                fontSize: 16,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by event name, location, keyword..."
            />
            <button
              className="btn-sm primary"
              onClick={handleSearch}
              disabled={!input.trim() || isLoading}
              style={{ flexShrink: 0 }}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* active query indicator */}
      {q && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          <span>
            Showing results for: <strong>{q}</strong>
          </span>
          <button
            onClick={() => {
              setInput("");
              setQ("");
              setParams({});
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--on-mut)",
              padding: 0,
            }}
          >
            <MS n="close" size={16} />
          </button>
        </div>
      )}

      {/* error state */}
      {isError && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--error)", padding: "32px 0" }}
          >
            Something went wrong. Please try again.
          </div>
        </div>
      )}

      {/* results grid */}
      {q && !isLoading && !isError && results.length > 0 && (
        <>
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--on-mut)",
              letterSpacing: "0.06em",
            }}
          >
            {results.length} event{results.length !== 1 ? "s" : ""} found
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
          >
            {results.map((ev) => (
              <div
                key={ev.id}
                className="panel"
                style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                onClick={() => navigate(`/events/${ev.id}`)}
              >
                <div
                  style={{
                    height: 140,
                    background: ev.cover_image
                      ? `url(${ev.cover_image}) center/cover`
                      : "linear-gradient(135deg, #050a26, #121d3f)",
                    position: "relative",
                  }}
                >
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
                    {ev.is_free ? "FREE" : `NPR ${parseFloat(ev.price).toLocaleString()}`}
                  </span>
                </div>
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
                      style={{
                        fontSize: 12,
                        color: "var(--on-var)",
                        fontFamily: "Manrope, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="calendar_today" size={14} style={{ color: "var(--on-mut)" }} />
                      {fmtDate(ev.start_date)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--on-var)",
                        fontFamily: "Manrope, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="location_on" size={14} style={{ color: "var(--on-mut)" }} />
                      {ev.location}
                    </span>
                  </div>
                  <div
                    style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--outline)" }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {ev.registered_count}/{ev.capacity} attending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* no results */}
      {q && !isLoading && !isError && results.length === 0 && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--on-mut)", padding: "40px 0" }}
          >
            <MS
              n="search_off"
              size={32}
              style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }}
            />
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--on-bg)",
                marginBottom: 6,
              }}
            >
              No events found
            </p>
            <p style={{ fontSize: 13, fontFamily: "Manrope, sans-serif" }}>
              Try a different keyword or browse all events.
            </p>
            <button
              className="btn-sm primary"
              onClick={() => navigate("/events")}
              style={{ marginTop: 16 }}
            >
              <MS n="explore" size={14} />
              Browse all events
            </button>
          </div>
        </div>
      )}

      {/* suggestion chips shown before first search */}
      {!q && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Popular searches</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    setQ(s);
                    setParams({ q: s });
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 20,
                    border: "1px solid var(--outline)",
                    background: "var(--surface)",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 13,
                    color: "var(--on-var)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="search" size={14} style={{ color: "var(--on-mut)" }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
