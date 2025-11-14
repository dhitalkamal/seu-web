export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "checked_in"
  | "waitlisted"
  | "no_show";

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registration_code: string;
  quantity: number;
  created_at: string;
};
