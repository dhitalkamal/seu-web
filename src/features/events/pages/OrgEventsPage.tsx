import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { useMyEvents, useEventMutations } from "@/features/events/hooks/useEvents";
import { cn } from "@/shared/lib/cn";
import type { Event } from "@/features/events/types/event.types";

/** Organiser's event management dashboard. */
export default function OrgEventsPage() {
  const { data, isLoading } = useMyEvents();
  const events = data?.results ?? [];

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope']">My events</h1>
          <Button onClick={() => (window.location.href = "/events/create")}>+ Create event</Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white border border-[#e0dfd8] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e0dfd8] rounded-2xl">
            <p className="text-[#6b6c75] font-['Manrope'] mb-4">
              You haven&apos;t created any events yet.
            </p>
            <Link to="/events/create">
              <Button>Create your first event</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function EventRow({ event }: { event: Event }) {
  const navigate = useNavigate();
  const { publishMutation, deleteMutation } = useEventMutations();

  const statusColors: Record<string, string> = {
    draft: "bg-[#f3f2ef] text-[#6b6c75]",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-[#e83151]/10 text-[#e83151]",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-[#e0dfd8] rounded-xl px-5 py-4 hover:border-[#dba13d]/40 transition-colors">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <Link
          to={`/events/${event.id}`}
          className="text-sm font-semibold text-[#19191e] font-['Manrope'] hover:text-[#121d3f] truncate"
        >
          {event.title}
        </Link>
        <p className="text-xs text-[#6b6c75] font-['Manrope']">
          {new Date(event.start_date).toLocaleDateString()} · {event.location}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            "text-xs font-semibold font-['Manrope'] px-2.5 py-1 rounded-full",
            statusColors[event.status] ?? "bg-[#f3f2ef] text-[#6b6c75]"
          )}
        >
          {event.status}
        </span>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/events/${event.id}/edit`)}
          >
            Edit
          </Button>
          {event.status === "draft" && (
            <Button
              size="sm"
              loading={publishMutation.isPending && publishMutation.variables === event.id}
              onClick={() => publishMutation.mutate(event.id)}
            >
              Publish
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            loading={deleteMutation.isPending && deleteMutation.variables === event.id}
            onClick={() => deleteMutation.mutate(event.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
