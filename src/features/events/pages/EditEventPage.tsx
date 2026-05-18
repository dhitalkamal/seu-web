import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import EventForm from "@/features/events/components/EventForm";
import { MS } from "@/shared/components/v8";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import eventsApi from "@/features/events/api/events.api";
import type { CreateEventRequest } from "@/features/events/types/event.types";

/** Edit an existing event, SEU v8 app shell. */
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
        <p style={{ color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
          Event not found.
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit event" subtitle={event.title}>
      {updateMutation.isError && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(232,49,81,0.08)",
            color: "var(--secondary)",
            border: "1px solid rgba(232,49,81,0.2)",
            fontFamily: "Manrope, sans-serif",
          }}
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
        <EventForm
          initial={event}
          onSubmit={handleSubmit}
          loading={updateMutation.isPending}
          submitLabel="Save changes"
        />
      </div>

      {/* media gallery */}
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <span className="panel-title">Gallery media</span>
        </div>
        <div className="panel-body">
          <EventMediaPanel eventId={id ?? ""} />
        </div>
      </div>
    </AppLayout>
  );
}

type MediaItem = { id: string; url: string; caption: string; position: number };

/**
 * Inline gallery manager shown on the edit event page.
 * Lets organisers add image URLs with captions and remove existing ones.
 * @param eventId - the event whose gallery is being managed.
 */
function EventMediaPanel({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const { data: media = [] } = useQuery<MediaItem[]>({
    queryKey: ["event-media", eventId],
    queryFn: () => eventsApi.listMedia(eventId),
    enabled: !!eventId,
  });

  const addMutation = useMutation({
    mutationFn: () => eventsApi.addMedia(eventId, { url, caption }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-media", eventId] });
      setUrl("");
      setCaption("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => eventsApi.deleteMedia(eventId, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-media", eventId] }),
  });

  return (
    <div>
      {/* add row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: 10,
          marginBottom: 14,
          alignItems: "flex-end",
        }}
      >
        <div className="field" style={{ margin: 0 }}>
          <label className="field-lab">Image URL</label>
          <input
            className="field-in"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-lab">Caption</label>
          <input
            className="field-in"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
          />
        </div>
        <button
          className="btn-sm primary"
          onClick={() => addMutation.mutate()}
          disabled={!url || addMutation.isPending}
        >
          <MS n="add" size={13} />
          Add
        </button>
      </div>

      {/* empty state */}
      {media.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
          No media yet. Add image URLs above.
        </p>
      ) : (
        /* media grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {media.map((m) => (
            <div
              key={m.id}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid var(--outline)",
              }}
            >
              <img
                src={m.url}
                alt={m.caption}
                style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  padding: "6px 10px",
                  fontSize: 11,
                  color: "var(--on-mut)",
                  background: "var(--surface)",
                }}
              >
                {m.caption || "No caption"}
              </div>
              <button
                onClick={() => deleteMutation.mutate(m.id)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 6px",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <MS n="delete" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
