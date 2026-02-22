/** API calls for the participation feature. */

import client from "@/shared/api/client";

const BASE = "/participation/api/v1";

export type PassportEntry = {
  event_id: string;
  event_name: string;
  role: "attendee" | "volunteer";
  status: string;
  attended_at: string;
  certificate_issued: boolean;
};

export type Passport = {
  user_id: string;
  entries: PassportEntry[];
  entry_count: number;
  generated_at: string;
  signature: string;
};

const participationApi = {
  /** Fetch the authenticated user's Verified Event Passport. */
  getPassport: () =>
    client.get<{ data: Passport }>(`${BASE}/passport/me/`).then((r) => r.data.data),
};

export default participationApi;
