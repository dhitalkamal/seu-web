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
};

export default registrationApi;
