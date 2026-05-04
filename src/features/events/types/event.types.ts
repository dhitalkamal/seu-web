/** Event-related types matching the event service API contract. */

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventVisibility = "public" | "private" | "unlisted";

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  depth: number;
};

export type Event = {
  id: string;
  organiser_id: string;
  title: string;
  description: string;
  location: string;
  // optional geo-coordinates populated by the backend when set
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  capacity: number;
  registered_count: number;
  status: EventStatus;
  visibility: EventVisibility;
  is_free: boolean;
  price: string;
  cover_image: string | null;
  is_online: boolean;
  online_url: string | null;
  category_id: string | null;
  tag_ids: string[];
  allowed_domains: string[];
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
  cover_image?: string | null;
  is_online?: boolean;
  online_url?: string | null;
  category_id?: string | null;
  tag_ids?: string[];
  allowed_domains?: string[];
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

export type EventListFilters = {
  organiser_id?: string;
  is_free?: boolean;
  search?: string;
  category?: string;
  // geo radius search - pass all three together
  lat?: number;
  lng?: number;
  radius_km?: number;
};

export type PaginatedEvents = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Event[];
};
