/** API calls for the check-in feature. */

import client from "@/shared/api/client";

const BASE = "/participation/api/v1";

export type CheckInResult = {
  registration_id: string;
  attendee_name: string;
  event_title: string;
  checked_in_at: string;
  already_checked_in: boolean;
};

export type BatchCheckInResult = {
  succeeded: string[];
  failed: { registration_id: string; reason: string }[];
};

type ApiOk<T> = { data: T };

const checkinApi = {
  /** Check in a single attendee by registration and event ID. */
  checkIn: (payload: { registration_id: string; event_id: string }) =>
    client.post<ApiOk<CheckInResult>>(`${BASE}/check-in/`, payload).then((r) => r.data.data),

  /** Check in multiple attendees in one request. */
  batchCheckIn: (payload: { registration_ids: string[]; event_id: string }) =>
    client
      .post<ApiOk<BatchCheckInResult>>(`${BASE}/check-in/batch/`, payload)
      .then((r) => r.data.data),

  /** Get the QR token for a registration, used for scanning at the door. */
  getQrToken: (registrationId: string) =>
    client
      .get<
        ApiOk<{ token: string; expires_at: string }>
      >(`${BASE}/registrations/${registrationId}/qr-token/`)
      .then((r) => r.data.data),

  /** Fetch a registration record by ID. */
  getRegistration: (registrationId: string) =>
    client
      .get<
        ApiOk<{ id: string; event_id: string; status: string; created_at: string }>
      >(`${BASE}/registrations/${registrationId}/`)
      .then((r) => r.data.data),

  /** Get aggregate check-in stats for an event (volunteer dashboard use). */
  getEventStats: (eventId: string) =>
    client
      .get<
        ApiOk<{ total: number; checked_in: number; remaining: number }>
      >(`${BASE}/volunteer/events/${eventId}/stats/`)
      .then((r) => r.data.data),

  /** Fetch the authenticated user's attendance passport. */
  getPassport: () =>
    client
      .get<ApiOk<{ events_attended: number; registrations: unknown[] }>>(`${BASE}/passport/me/`)
      .then((r) => r.data.data),

  /** Fetch all volunteer shifts for the authenticated user. */
  getVolunteerShifts: () =>
    client.get<ApiOk<unknown[]>>(`${BASE}/volunteer/shifts/`).then((r) => r.data.data ?? []),
};

export default checkinApi;
