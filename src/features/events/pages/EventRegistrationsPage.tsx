import { Link, useParams } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { useEvent } from "@/features/events/hooks/useEvents";

/**
 * Organiser view of everyone who registered for a specific event.
 * The participation service backend is not yet implemented — shows a placeholder.
 */
export default function EventRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event } = useEvent(id ?? "");

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to={`/events/${id}`}
          className="text-sm text-[#6b6c75] hover:text-[#19191e] font-['Manrope'] mb-6 inline-block"
        >
          ← Back to event
        </Link>

        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-2">Registrations</h1>
        {event && <p className="text-sm text-[#6b6c75] font-['Manrope'] mb-8">{event.title}</p>}

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f3f2ef] flex items-center justify-center text-3xl">
            🚧
          </div>
          <h2 className="text-base font-bold text-[#19191e] font-['Manrope']">
            Registrations coming soon
          </h2>
          <p className="text-sm text-[#6b6c75] font-['Manrope'] max-w-sm">
            The participation service is being built. Attendee registration and check-in will be
            available here once it&apos;s live.
          </p>
          <div className="mt-2 flex gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#121d3f] font-['Manrope']">
                {event?.registered_count ?? 0}
              </p>
              <p className="text-xs text-[#6b6c75] font-['Manrope']">Registered</p>
            </div>
            <div className="w-px bg-[#e0dfd8]" />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#121d3f] font-['Manrope']">
                {event ? event.capacity - event.registered_count : 0}
              </p>
              <p className="text-xs text-[#6b6c75] font-['Manrope']">Spots left</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
