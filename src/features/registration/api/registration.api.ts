/** API calls for the registration feature. */

import client from "@/shared/api/client";
import type { RegisterResponse, Registration } from "../types";

const BASE = "/participation/api/v1";

const registrationApi = {
  /** Fetch all registrations for the authenticated user. */
  listMine: () =>
    client.get<{ data: Registration[] }>(`${BASE}/registrations/`).then((r) => r.data.data),

  /** Register for an event. */
  register: (payload: { event_id: string; quantity?: number; notes?: string }) =>
    client
      .post<{ data: RegisterResponse }>(`${BASE}/registrations/`, payload)
      .then((r) => r.data.data),

  /** Cancel a registration. */
  cancel: (registration_id: string) =>
    client
      .post<{ data: Registration }>(`${BASE}/registrations/cancel/`, { registration_id })
      .then((r) => r.data.data),

  /** Fetch a single registration by ID. */
  getRegistration: (id: string) =>
    client.get<{ data: Registration }>(`${BASE}/registrations/${id}/`).then((r) => r.data.data),

  /** Get the QR token for a registration, used for check-in scanning. */
  getQrToken: (id: string) =>
    client
      .get<{ data: { token: string; expires_at: string } }>(`${BASE}/registrations/${id}/qr-token/`)
      .then((r) => r.data.data),

  /** Delete a registration record. */
  deleteRegistration: (id: string) => client.delete(`${BASE}/registrations/${id}/`),
};

export default registrationApi;
