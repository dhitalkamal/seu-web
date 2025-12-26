import { useState } from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import EventTile from "@/features/events/components/EventTile";

type SortOption = "soonest" | "newest" | "name";

/** Full event browse page — search, free/paid filter, sort, SEU v8 design. */
export default function EventListPage() {
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>("soonest");

  const { data, isLoading } = usePublicEvents({ search: search || undefined, is_free: freeOnly });

  const events = [...(data?.results ?? [])].sort((a, b) => {
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "soonest") return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    return a.title.localeCompare(b.title);
  });

  return (
    <PublicLayout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 80px" }}>
        {/* page header */}
        <div className="mb-8">
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
            <span className="w-8 h-px bg-[var(--secondary)]" />
            Browse
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 40px)",
              letterSpacing: "-0.04em",
              color: "var(--on-bg)",
              lineHeight: 1.05,
            }}
          >
            All events
          </h1>
        </div>

        {/* filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 flex-wrap">
          {/* search */}
          <div
            className="flex items-center gap-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 10,
              padding: "8px 14px",
              flex: 1,
              minWidth: 240,
            }}
          >
            <span className="ms text-[var(--on-mut)]" style={{ fontSize: 16 }}>search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: "Manrope, sans-serif",
                fontSize: 13,
                color: "var(--on-bg)",
                flex: 1,
              }}
            />
          </div>

          {/* free/paid pills */}
          <div className="flex gap-2">
            {(
              [
                { label: "All", value: undefined },
                { label: "Free", value: true },
                { label: "Paid", value: false },
              ] as { label: string; value: boolean | undefined }[]
            ).map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setFreeOnly(opt.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--outline)",
                  background: freeOnly === opt.value ? "var(--primary)" : "var(--surface)",
                  color: freeOnly === opt.value ? "white" : "var(--on-var)",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--outline)",
              background: "var(--surface)",
              fontFamily: "Manrope, sans-serif",
              fontSize: 13,
              color: "var(--on-bg)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="soonest">Soonest first</option>
            <option value="newest">Newest first</option>
            <option value="name">A → Z</option>
          </select>
        </div>

        {/* results count */}
        <p
          className="mb-5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--on-mut)",
          }}
        >
          {isLoading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""} found`}
        </p>

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
              No events match your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventTile key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
