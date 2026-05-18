/** API calls for event categories and tags. */

import client from "@/shared/api/client";

const BASE = "/event/api/v1";

export type EventCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type EventTag = {
  id: string;
  name: string;
  slug: string;
};

type ApiOk<T> = { data: T };

const taxonomyApi = {
  /** Fetch all event categories. */
  listCategories: () =>
    client.get<ApiOk<EventCategory[]>>(`${BASE}/categories/`).then((r) => r.data.data ?? []),

  /** Create a new event category. */
  createCategory: (payload: { name: string; slug: string; description?: string }) =>
    client.post<ApiOk<EventCategory>>(`${BASE}/categories/`, payload).then((r) => r.data.data),

  /** Fetch all event tags. */
  listTags: () => client.get<ApiOk<EventTag[]>>(`${BASE}/tags/`).then((r) => r.data.data ?? []),

  /** Create a new event tag. */
  createTag: (payload: { name: string; slug: string }) =>
    client.post<ApiOk<EventTag>>(`${BASE}/tags/`, payload).then((r) => r.data.data),
};

export default taxonomyApi;
