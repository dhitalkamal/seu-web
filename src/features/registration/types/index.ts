/** Registration domain types - re-exports for feature consumers. */

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: "pending" | "confirmed" | "cancelled" | "checked_in" | "waitlisted" | "no_show";
  registration_code: string;
  quantity: number;
  notes: string | null;
  checked_in_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  networking_opt_in?: boolean;
};

export type WaitlistEntry = {
  id: string;
  event_id: string;
  user_id: string;
  position: number;
  expires_at: string | null;
  created_at: string;
  waitlisted: true;
};

export type RegisterResponse = Registration | WaitlistEntry;
