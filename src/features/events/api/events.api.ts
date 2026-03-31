import client from "@/shared/api/client";
import type {
  Category,
  CreateEventRequest,
  Event,
  EventListFilters,
  PaginatedEvents,
  UpdateEventRequest,
} from "@/features/events/types/event.types";

const EVENTS_BASE = "/event/api/v1/events";
const CATEGORIES_BASE = "/event/api/v1/categories";

type ApiResponse<T> = { data: T; error: unknown; meta: unknown };

/** Fetch paginated list of public published events with optional filters. */
async function listPublicEvents(filters?: EventListFilters): Promise<PaginatedEvents> {
  const params = new URLSearchParams();
  if (filters?.organiser_id) params.set("organiser_id", filters.organiser_id);
  if (filters?.is_free !== undefined) params.set("is_free", String(filters.is_free));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category_id", filters.category);
  const res = await client.get<PaginatedEvents>(`${EVENTS_BASE}/?${params}`);
  return res.data;
}

/** Fetch all events owned by the authenticated organiser. */
async function listMyEvents(): Promise<PaginatedEvents> {
  const res = await client.get<PaginatedEvents>(`${EVENTS_BASE}/my/`);
  return res.data;
}

/** Fetch a single event by ID. */
async function getEvent(id: string): Promise<ApiResponse<Event>> {
  const res = await client.get<ApiResponse<Event>>(`${EVENTS_BASE}/${id}/`);
  return res.data;
}

/** Create a new draft event. */
async function createEvent(payload: CreateEventRequest): Promise<ApiResponse<Event>> {
  const res = await client.post<ApiResponse<Event>>(`${EVENTS_BASE}/`, payload);
  return res.data;
}

/** Fetch all event categories. */
async function listCategories(): Promise<ApiResponse<Category[]>> {
  const res = await client.get<ApiResponse<Category[]>>(`${CATEGORIES_BASE}/`);
  return res.data;
}

/** Create a new root-level category. */
async function createCategory(name: string, slug: string): Promise<ApiResponse<Category>> {
  const res = await client.post<ApiResponse<Category>>(`${CATEGORIES_BASE}/`, { name, slug });
  return res.data;
}

/** Partially update an event. */
async function updateEvent(id: string, payload: UpdateEventRequest): Promise<ApiResponse<Event>> {
  const res = await client.patch<ApiResponse<Event>>(`${EVENTS_BASE}/${id}/`, payload);
  return res.data;
}

/** Publish a draft event. */
async function publishEvent(id: string): Promise<ApiResponse<Event>> {
  const res = await client.post<ApiResponse<Event>>(`${EVENTS_BASE}/${id}/publish/`);
  return res.data;
}

/** Soft-delete an event. */
async function deleteEvent(id: string): Promise<void> {
  await client.delete(`${EVENTS_BASE}/${id}/`);
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
  const res = await client.post<ApiResponse<Event>>(`${EVENTS_BASE}/${id}/complete/`);
  return res.data;
}

type MediaItem = { id: string; url: string; caption: string; position: number };

/** List gallery media for an event. */
async function listMedia(id: string): Promise<MediaItem[]> {
  const res = await client.get<{ data: MediaItem[] }>(`${EVENTS_BASE}/${id}/media/`);
  return res.data.data ?? [];
}

/** Add a media item to an event gallery. */
async function addMedia(
  id: string,
  payload: { url: string; caption?: string; position?: number }
): Promise<MediaItem> {
  const res = await client.post<{ data: MediaItem }>(`${EVENTS_BASE}/${id}/media/`, payload);
  return res.data.data;
}

/** Remove a media item from an event gallery. */
function deleteMedia(eventId: string, mediaId: string) {
  return client.delete(`${EVENTS_BASE}/${eventId}/media/${mediaId}/`);
}

/** A single event review submitted by an attendee. */
export type EventReview = {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  highlights: string[];
  note: string;
  created_at: string;
};

/** Aggregated review summary returned by the backend. */
export type ReviewSummary = {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
};

/**
 * Submit a review for a completed event.
 * @param eventId - UUID of the event.
 * @param data - rating (1-5), highlight tags, and optional note.
 */
async function submitReview(
  eventId: string,
  data: { rating: number; highlights: string[]; note: string }
): Promise<ApiResponse<EventReview>> {
  const res = await client.post<ApiResponse<EventReview>>(
    `${EVENTS_BASE}/${eventId}/reviews/`,
    data
  );
  return res.data;
}

/** Fetch all reviews for a given event. */
async function listReviews(eventId: string): Promise<EventReview[]> {
  const res = await client.get<ApiResponse<EventReview[]>>(`${EVENTS_BASE}/${eventId}/reviews/`);
  return (res.data?.data ?? res.data) as EventReview[];
}

/** Fetch aggregated review summary for an event. */
async function getReviewSummary(eventId: string): Promise<ReviewSummary | null> {
  const res = await client.get<ApiResponse<ReviewSummary>>(
    `${EVENTS_BASE}/${eventId}/reviews/summary/`
  );
  return (res.data?.data ?? res.data) as ReviewSummary | null;
}

const eventsApi = {
  listPublicEvents,
  listMyEvents,
  listCategories,
  createCategory,
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
  submitReview,
  listReviews,
  getReviewSummary,
};

export default eventsApi;
