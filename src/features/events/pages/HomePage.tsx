import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/shared/components/ui";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import type { Event } from "@/features/events/types/event.types";

/** Home page — browse all published public events. */
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
      <section className="bg-[#121d3f] text-white px-4 py-16 text-center">
        <h1 className="text-4xl font-bold font-['Manrope'] mb-3">Discover events near you</h1>
        <p className="text-[#a8b8d8] font-['Manrope'] mb-8 max-w-md mx-auto">
          Find concerts, meetups, workshops and more on Sansaar.
        </p>
        <div className="max-w-md mx-auto">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="bg-white text-[#19191e]"
          />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* filters */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-semibold text-[#19191e] font-['Manrope']">
            {data?.count ?? 0} events
          </span>
          <label className="flex items-center gap-2 text-sm text-[#6b6c75] font-['Manrope'] cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded"
            />
            Free only
          </label>
        </div>

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
          <div className="text-center py-20">
            <p className="text-[#6b6c75] font-['Manrope']">No events found.</p>
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
      <div className="bg-[#f3f2ef] h-32 flex items-center justify-center">
        <span className="text-4xl">🎟️</span>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <p className="text-xs text-[#dba13d] font-semibold font-['Manrope'] uppercase tracking-wide">
          {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <h3 className="text-sm font-bold text-[#19191e] font-['Manrope'] line-clamp-2 group-hover:text-[#121d3f]">
          {event.title}
        </h3>
        <p className="text-xs text-[#6b6c75] font-['Manrope'] truncate">{event.location}</p>
        <p className="text-xs font-semibold text-[#19191e] font-['Manrope'] mt-auto pt-1">
          {event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`}
        </p>
      </div>
    </Link>
  );
}
