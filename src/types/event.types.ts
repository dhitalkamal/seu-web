export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventVisibility = "public" | "private" | "unlisted";

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  organiser_id: string;
  status: EventStatus;
  visibility: EventVisibility;
  location: string;
  is_online: boolean;
  start_date: string;
  end_date: string;
  capacity: number | null;
  registered_count: number;
  is_free: boolean;
  price: string;
  currency: string;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};
