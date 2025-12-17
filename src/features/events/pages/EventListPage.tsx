import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/shared/components/ui";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import { cn } from "@/shared/lib/cn";
import type { Event, EventVisibility } from "@/features/events/types/event.types";

type SortOption = "newest" | "soonest" | "name";

/** Full event listing page with search, free/paid and visibility filters, and sort. */
export default function EventListPage() {
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>("soonest");

  const { data, isLoading } = usePublicEvents({ search: search || undefined, is_free: freeOnly });

  const events = [...(data?.results ?? [])].sort((a, b) => {
    if (sort === "newest")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "soonest")
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    return a.title.localeCompare(b.title);
  });

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-6">Browse events</h1>

        {/* filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title…"
            />
          </div>

          {/* free/paid pills */}
          <div className="flex gap-2">
            {[
              { label: "All", value: undefined },
              { label: "Free", value: true },
              { label: "Paid", value: false },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setFreeOnly(opt.value)}
                className={cn(
                  "px-4 h-11 rounded-xl text-sm font-semibold font-['Manrope'] border transition-colors",
                  freeOnly === opt.value
                    ? "bg-[#121d3f] text-white border-[#121d3f]"
                    : "bg-white text-[#6b6c75] border-[#e0dfd8] hover:border-[#dba13d]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="h-11 rounded-xl border border-[#e0dfd8] px-3 text-sm font-['Manrope'] text-[#19191e] bg-white outline-none focus:border-[#dba13d]"
          >
            <option value="soonest">Soonest first</option>
            <option value="newest">Newest first</option>
            <option value="name">A → Z</option>
          </select>
        </div>

        {/* results count */}
        <p className="text-sm text-[#6b6c75] font-['Manrope'] mb-4">
          {isLoading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""} found`}
        </p>

        {/* grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-white border border-[#e0dfd8] animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e0dfd8] rounded-2xl">
            <p className="text-[#6b6c75] font-['Manrope']">No events match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function EventCard({ event }: { event: Event }) {
  const start = new Date(event.start_date);
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col bg-white border border-[#e0dfd8] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#dba13d]/40 transition-all"
    >
      <div className="bg-[#f3f2ef] h-32 flex items-center justify-center text-4xl">🎟️</div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <p className="text-xs text-[#dba13d] font-semibold font-['Manrope'] uppercase tracking-wide">
          {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <h3 className="text-sm font-bold text-[#19191e] font-['Manrope'] line-clamp-2 group-hover:text-[#121d3f]">
          {event.title}
        </h3>
        <p className="text-xs text-[#6b6c75] font-['Manrope'] truncate">{event.location}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <p className="text-xs font-semibold text-[#19191e] font-['Manrope']">
            {event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`}
          </p>
          <p className="text-xs text-[#9b9ca4] font-['Manrope']">
            {event.capacity - event.registered_count} spots left
          </p>
        </div>
      </div>
    </Link>
  );
}
