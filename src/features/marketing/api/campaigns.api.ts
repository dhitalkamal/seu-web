import client from "@/shared/api/client";

const BASE = "/org/api/v1/campaigns";

// * types

export type Campaign = {
  id: string;
  name: string;
  status: string;
  sent_count: number;
  created_at: string;
};

export type Segment = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  member_count: number;
};

type ApiOk<T> = { data: T };

// * api client

/** Marketing campaigns API calls. */
const campaignsApi = {
  /** Fetch all campaigns. */
  list: () => client.get<ApiOk<Campaign[]>>(`${BASE}/`).then((r) => r.data.data ?? []),

  /** Create a new campaign. */
  create: (payload: { name: string; subject?: string; body?: string }) =>
    client.post<ApiOk<Campaign>>(`${BASE}/`, payload).then((r) => r.data.data),

  /** Trigger sending a campaign by id. */
  send: (id: string) =>
    client.post<ApiOk<Campaign>>(`${BASE}/${id}/send/`).then((r) => r.data.data),

  /** Fetch all audience segments. */
  listSegments: () =>
    client.get<ApiOk<Segment[]>>(`${BASE}/segments/`).then((r) => r.data.data ?? []),

  /** Create a new audience segment. */
  createSegment: (payload: { name: string; filters: Record<string, unknown> }) =>
    client.post<ApiOk<Segment>>(`${BASE}/segments/`, payload).then((r) => r.data.data),
};

export default campaignsApi;
