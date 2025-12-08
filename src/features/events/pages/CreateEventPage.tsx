import { useNavigate } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";
import EventForm from "@/features/events/components/EventForm";
import { useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import type { CreateEventRequest } from "@/features/events/types/event.types";

/** Create a new draft event. */
export default function CreateEventPage() {
  const navigate = useNavigate();
  const { createMutation } = useEventMutations();

  function handleSubmit(data: CreateEventRequest) {
    createMutation.mutate(data, {
      onSuccess: (res) => navigate(`/events/${res.data.id}`),
    });
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">Create event</h1>

        {createMutation.isError && (
          <div className="mb-6 rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope']">
            {getApiError(createMutation.error)}
          </div>
        )}

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-8">
          <EventForm
            onSubmit={handleSubmit}
            loading={createMutation.isPending}
            submitLabel="Create event"
          />
        </div>
      </div>
    </PublicLayout>
  );
}
