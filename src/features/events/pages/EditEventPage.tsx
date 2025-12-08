import { useNavigate, useParams } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";
import EventForm from "@/features/events/components/EventForm";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import type { CreateEventRequest } from "@/features/events/types/event.types";

/** Edit an existing event. Only the organiser can access this page. */
export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id ?? "");
  const { updateMutation } = useEventMutations();

  function handleSubmit(data: CreateEventRequest) {
    if (!id) return;
    updateMutation.mutate({ id, payload: data }, { onSuccess: () => navigate(`/events/${id}`) });
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="h-8 w-48 bg-[#e0dfd8] rounded-lg animate-pulse mb-6" />
          <div className="h-96 bg-white border border-[#e0dfd8] rounded-2xl animate-pulse" />
        </div>
      </PublicLayout>
    );
  }

  if (!event) {
    return (
      <PublicLayout>
        <div className="text-center py-20">
          <p className="text-[#6b6c75] font-['Manrope']">Event not found.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">Edit event</h1>

        {updateMutation.isError && (
          <div className="mb-6 rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(updateMutation.error)}
          </div>
        )}

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-8">
          <EventForm
            initial={event}
            onSubmit={handleSubmit}
            loading={updateMutation.isPending}
            submitLabel="Save changes"
          />
        </div>
      </div>
    </PublicLayout>
  );
}
