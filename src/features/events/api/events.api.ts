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

const eventsApi = {
  listPublicEvents,
  listMyEvents,
  getEvent,
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
};

export default eventsApi;
