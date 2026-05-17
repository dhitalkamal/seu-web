import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import { useAuthStore } from "@/shared/store/auth.store";

/** Public event detail page — anyone can view, organiser can manage. */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: event, isLoading } = useEvent(id ?? "");
  const { publishMutation, deleteMutation } = useEventMutations();

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="h-10 w-64 bg-[#e0dfd8] rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-full bg-[#e0dfd8] rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-[#e0dfd8] rounded animate-pulse" />
        </div>
      </PublicLayout>
    );
  }

  if (!event) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-[#6b6c75] font-['Manrope']">Event not found.</p>
          <Link
            to="/"
            className="text-[#121d3f] font-semibold hover:underline text-sm font-['Manrope'] mt-4 inline-block"
          >
            Back to events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const isOrganiser = user?.id === event.organiser_id;
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* breadcrumb */}
        <Link
          to="/"
          className="text-sm text-[#6b6c75] hover:text-[#19191e] font-['Manrope'] mb-6 inline-block"
        >
          ← All events
        </Link>

        <div className="bg-white border border-[#e0dfd8] rounded-2xl overflow-hidden">
          {/* header */}
          <div className="bg-[#f3f2ef] h-40 flex items-center justify-center">
            <span className="text-6xl">🎟️</span>
          </div>

          <div className="p-8">
            {/* status badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs font-semibold font-['Manrope'] px-2.5 py-1 rounded-full ${
                  event.status === "published"
                    ? "bg-green-100 text-green-700"
                    : event.status === "draft"
                      ? "bg-[#f3f2ef] text-[#6b6c75]"
                      : "bg-[#e83151]/10 text-[#e83151]"
                }`}
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
              <span className="text-xs text-[#6b6c75] font-['Manrope']">{event.visibility}</span>
            </div>

            <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-3">
              {event.title}
            </h1>

            {/* meta */}
            <div className="flex flex-col gap-2 mb-6 text-sm text-[#6b6c75] font-['Manrope']">
              <p>
                📅 {start.toLocaleString()} — {end.toLocaleString()}
              </p>
              <p>📍 {event.location}</p>
              <p>
                👥 {event.registered_count} / {event.capacity} registered
              </p>
              <p className="font-semibold text-[#19191e]">
                {event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`}
              </p>
            </div>

            <p className="text-sm text-[#45464e] font-['Manrope'] leading-relaxed mb-8 whitespace-pre-line">
              {event.description}
            </p>

            {/* actions */}
            {isOrganiser ? (
              <div className="flex gap-3 flex-wrap pt-6 border-t border-[#e0dfd8]">
                <Button variant="secondary" onClick={() => navigate(`/events/${event.id}/edit`)}>
                  Edit
                </Button>
                {event.status === "draft" && (
                  <Button
                    loading={publishMutation.isPending}
                    onClick={() =>
                      publishMutation.mutate(event.id, { onSuccess: () => navigate(0) })
                    }
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(event.id, { onSuccess: () => navigate("/events/mine") })
                  }
                >
                  Delete
                </Button>
              </div>
            ) : (
              <Button size="lg" className="w-full sm:w-auto">
                Register for this event
              </Button>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
