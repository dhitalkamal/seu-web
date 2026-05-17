import { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import EventTile from "@/features/events/components/EventTile";

const UPCOMING_PREVIEWS = [
  { date: "OCT 12", title: "Quantum Computing Summit", meta: "East Atrium · 1,500 seats" },
  { date: "OCT 26", title: "Sustainability Ethics Gala", meta: "Grand Hall · 1,000 seats" },
  { date: "NOV 4", title: "Urban Design Workshop", meta: "Studio B · 100 seats" },
];

/** Public landing page with SEU v8 dark hero + events grid. */
export default function HomePage() {
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  const { data, isLoading } = usePublicEvents({
    search: search || undefined,
    is_free: freeOnly || undefined,
  });

  const events = data?.results ?? [];

  return (
    <PublicLayout>
      {/* hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: "radial-gradient(ellipse at top, #1a2750 0%, #050a26 70%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "80px 32px 80px",
          marginTop: "-96px",
          paddingTop: "140px",
        }}
      >
        {/* bloom accents */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 85% 30%, rgba(232,49,81,0.22), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(219,161,61,0.16), transparent 60%)",
          }}
        />

        <div
          className="relative w-full grid gap-16 items-center"
          style={{ maxWidth: 1280, margin: "0 auto", gridTemplateColumns: "1.1fr 1fr" }}
        >
          {/* left */}
          <div>
            {/* eyebrow */}
            <div
              className="flex items-center gap-3 mb-7"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--tertiary)",
              }}
            >
              <span className="w-12 h-px bg-[var(--tertiary)]" />
              Sansaar · Event Universe
            </div>

            <h1
              className="text-white mb-6"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: "clamp(48px, 6vw, 84px)",
                lineHeight: 0.96,
                letterSpacing: "-0.045em",
              }}
            >
              Where events
              <br />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--tertiary)" }}>
                come alive.
              </span>
            </h1>

            <p
              className="mb-9"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 21,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.72)",
                maxWidth: "38ch",
              }}
            >
              Discover conferences, workshops, galas and more — all in one place.
              From free meetups to flagship summits.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-12">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 font-semibold no-underline transition-all hover:opacity-90"
                style={{
                  padding: "16px 28px",
                  borderRadius: 14,
                  background: "white",
                  color: "var(--primary)",
                  fontSize: 15,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Browse events
                <span className="ms">arrow_forward</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 font-semibold text-white no-underline transition-all"
                style={{
                  padding: "16px 26px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.25)",
                  fontSize: 15,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Get started free
              </Link>
            </div>

            {/* stats */}
            <div
              className="grid gap-12 pt-8"
              style={{ gridTemplateColumns: "repeat(3, auto)", borderTop: "1px solid rgba(255,255,255,0.12)" }}
            >
              {[
                { v: "2,400+", k: "Events monthly" },
                { v: "180k", k: "Attendees" },
                { v: "98%", k: "Satisfaction" },
              ].map(({ v, k }) => (
                <div key={k}>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                    }}
                  >
                    {k}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 32,
                      letterSpacing: "-0.04em",
                      color: "white",
                      lineHeight: 1,
                    }}
                  >
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* right — glassmorphic preview cards (desktop) */}
          <div className="hidden lg:flex flex-col gap-3">
            {UPCOMING_PREVIEWS.map((ev) => (
              <div
                key={ev.title}
                className="flex items-center gap-4 cursor-pointer transition-all hover:translate-x-[-4px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  padding: "16px 18px",
                }}
              >
                <div
                  className="flex-shrink-0 grid place-items-center text-white font-bold rounded-xl"
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(255,255,255,0.12)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textAlign: "center",
                  }}
                >
                  {ev.date}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-white truncate"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, letterSpacing: "-0.015em" }}
                  >
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{ev.meta}</p>
                </div>
                <span className="ms text-white opacity-40" style={{ fontSize: 18 }}>
                  chevron_right
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* events section */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 32px 80px" }}>
        {/* section heading */}
        <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
          <div>
            <div
              className="flex items-center gap-3 mb-3"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--secondary)",
              }}
            >
              <span className="w-12 h-px bg-[var(--secondary)]" />
              Upcoming events
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-0.04em",
                color: "var(--on-bg)",
                lineHeight: 1.05,
              }}
            >
              Find your next experience
            </h2>
          </div>

          {/* filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <span className="ms text-[var(--on-mut)]" style={{ fontSize: 16 }}>search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 13,
                  color: "var(--on-bg)",
                  width: 180,
                }}
              />
            </div>
            <label
              className="flex items-center gap-2 cursor-pointer select-none"
              style={{
                background: freeOnly ? "var(--primary)" : "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: freeOnly ? "white" : "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                transition: "all 200ms",
              }}
            >
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="hidden"
              />
              Free only
            </label>
          </div>
        </div>

        {/* results count */}
        {!isLoading && (
          <p
            className="mb-6"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--on-mut)",
            }}
          >
            {data?.count ?? 0} events found
          </p>
        )}

        {/* grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: 300, borderRadius: 18, background: "var(--surface)" }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div
            className="text-center py-20"
            style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--outline)" }}
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventTile key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
