/** API calls for the venues feature. */

import client from "@/shared/api/client";

const BASE = "/org/api/v1/venues";

export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  description: string;
  organisation_id: string;
  created_at: string;
  // optional geo coords provided by backend
  latitude: number | null;
  longitude: number | null;
};

export type Space = {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  description: string;
};

type ApiOk<T> = { data: T };

const venuesApi = {
  /** Fetch all venues for the authenticated org. */
  list: (orgId: string) =>
    client.get<ApiOk<Venue[]>>(`${BASE}/?organisation_id=${orgId}`).then((r) => r.data.data ?? []),

  /** Create a new venue. */
  create: (payload: {
    name: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
    organisation_id: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    website?: string;
  }) => client.post<ApiOk<Venue>>(`${BASE}/`, payload).then((r) => r.data.data),

  /** Fetch a single venue by ID. */
  get: (id: string) => client.get<ApiOk<Venue>>(`${BASE}/${id}/`).then((r) => r.data.data),

  /** List all spaces belonging to a venue. */
  listSpaces: (venueId: string) =>
    client.get<ApiOk<Space[]>>(`${BASE}/${venueId}/spaces/`).then((r) => r.data.data ?? []),

  /** Create a space inside a venue. */
  createSpace: (
    venueId: string,
    payload: { name: string; capacity: number; description?: string }
  ) => client.post<ApiOk<Space>>(`${BASE}/${venueId}/spaces/`, payload).then((r) => r.data.data),
};

export default venuesApi;
