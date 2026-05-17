/** Event-related types matching the event service API contract. */

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventVisibility = "public" | "private" | "unlisted";

export type Event = {
  id: string;
  organiser_id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  registered_count: number;
  status: EventStatus;
  visibility: EventVisibility;
  is_free: boolean;
  price: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateEventRequest = {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  visibility: EventVisibility;
  is_free: boolean;
  price: string;
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

export type EventListFilters = {
  organiser_id?: string;
  is_free?: boolean;
  search?: string;
};

export type PaginatedEvents = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Event[];
};
