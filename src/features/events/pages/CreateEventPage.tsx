import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import EventForm from "@/features/events/components/EventForm";
import { useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import type { CreateEventRequest } from "@/features/events/types/event.types";

/** Create a new draft event — SEU v8 app shell. */
export default function CreateEventPage() {
  const navigate = useNavigate();
  const { createMutation } = useEventMutations();

  function handleSubmit(data: CreateEventRequest) {
    createMutation.mutate(data, {
      onSuccess: (res) => navigate(`/events/${res.data.id}`),
    });
  }

  return (
    <AppLayout title="Create event" subtitle="Start with a draft — publish when ready.">
      {createMutation.isError && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" }}
        >
          {getApiError(createMutation.error)}
        </div>
      )}
      <div
        style={{
          maxWidth: 720,
          background: "var(--surface)",
          border: "1px solid var(--outline)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <EventForm onSubmit={handleSubmit} loading={createMutation.isPending} submitLabel="Create event" />
      </div>
    </AppLayout>
  );
}
