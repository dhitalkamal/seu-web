import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import EventForm from "@/features/events/components/EventForm";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import type { CreateEventRequest } from "@/features/events/types/event.types";

/** Edit an existing event — SEU v8 app shell. */
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
      <AppLayout title="Edit event">
        <div style={{ maxWidth: 720 }}>
          <div className="animate-pulse space-y-3">
            <div style={{ height: 20, width: "30%", borderRadius: 8, background: "var(--low)" }} />
            <div style={{ height: 400, borderRadius: 16, background: "var(--surface)" }} />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout title="Event not found">
        <p style={{ color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>Event not found.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit event" subtitle={event.title}>
      {updateMutation.isError && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(232,49,81,0.08)", color: "var(--secondary)", border: "1px solid rgba(232,49,81,0.2)", fontFamily: "Manrope, sans-serif" }}
        >
          {getApiError(updateMutation.error)}
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
        <EventForm initial={event} onSubmit={handleSubmit} loading={updateMutation.isPending} submitLabel="Save changes" />
      </div>
    </AppLayout>
  );
}
