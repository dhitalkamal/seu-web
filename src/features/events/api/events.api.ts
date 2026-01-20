import client from "@/shared/api/client";
import type {
  CreateEventRequest,
  Event,
  EventListFilters,
  PaginatedEvents,
  UpdateEventRequest,
} from "@/features/events/types/event.types";

const BASE = "/event/api/v1/events";

type ApiResponse<T> = { data: T; error: unknown; meta: unknown };

/** Fetch paginated list of public published events with optional filters. */
async function listPublicEvents(filters?: EventListFilters): Promise<PaginatedEvents> {
  const params = new URLSearchParams();
  if (filters?.organiser_id) params.set("organiser_id", filters.organiser_id);
  if (filters?.is_free !== undefined) params.set("is_free", String(filters.is_free));
  if (filters?.search) params.set("search", filters.search);
  const res = await client.get<PaginatedEvents>(`${BASE}/?${params}`);
  return res.data;
}

/** Fetch all events owned by the authenticated organiser. */
async function listMyEvents(): Promise<PaginatedEvents> {
  const res = await client.get<PaginatedEvents>(`${BASE}/my/`);
  return res.data;
}

/** Fetch a single event by ID. */
async function getEvent(id: string): Promise<ApiResponse<Event>> {
  const res = await client.get<ApiResponse<Event>>(`${BASE}/${id}/`);
  return res.data;
}

/** Create a new draft event. */
async function createEvent(payload: CreateEventRequest): Promise<ApiResponse<Event>> {
  const res = await client.post<ApiResponse<Event>>(`${BASE}/`, payload);
  return res.data;
}

/** Partially update an event. */
async function updateEvent(id: string, payload: UpdateEventRequest): Promise<ApiResponse<Event>> {
  const res = await client.patch<ApiResponse<Event>>(`${BASE}/${id}/`, payload);
  return res.data;
}

/** Publish a draft event. */
async function publishEvent(id: string): Promise<ApiResponse<Event>> {
  const res = await client.post<ApiResponse<Event>>(`${BASE}/${id}/publish/`);
  return res.data;
}

/** Soft-delete an event. */
async function deleteEvent(id: string): Promise<void> {
  await client.delete(`${BASE}/${id}/`);
}

/** Upload a cover image and get back the URL. */
async function uploadCover(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post<{ data: { url: string } }>("/event/api/v1/uploads/cover/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.url;
}

/** Mark an event as completed. */
async function completeEvent(id: string): Promise<ApiResponse<Event>> {
  const res = await client.post<ApiResponse<Event>>(`${BASE}/${id}/complete/`);
  return res.data;
}

type MediaItem = { id: string; url: string; caption: string; position: number };

/** List gallery media for an event. */
async function listMedia(id: string): Promise<MediaItem[]> {
  const res = await client.get<{ data: MediaItem[] }>(`${BASE}/${id}/media/`);
  return res.data.data ?? [];
}

/** Add a media item to an event gallery. */
async function addMedia(
  id: string,
  payload: { url: string; caption?: string; position?: number }
): Promise<MediaItem> {
  const res = await client.post<{ data: MediaItem }>(`${BASE}/${id}/media/`, payload);
  return res.data.data;
}

/** Remove a media item from an event gallery. */
function deleteMedia(eventId: string, mediaId: string) {
  return client.delete(`${BASE}/${eventId}/media/${mediaId}/`);
}

const eventsApi = {
  listPublicEvents,
  listMyEvents,
  getEvent,
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
  uploadCover,
  completeEvent,
  listMedia,
  addMedia,
  deleteMedia,
};

export default eventsApi;
