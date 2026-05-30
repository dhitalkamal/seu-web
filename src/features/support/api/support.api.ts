import client from "@/shared/api/client";

type ApiOk<T> = { data: T; error: null; meta: Record<string, unknown> };

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  priority: "low" | "med" | "high" | "critical";
  status: "open" | "in_progress" | "escalated" | "resolved" | "closed";
  org_id: string | null;
  org_name: string;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
};

const BASE = "/org/api/v1/tickets";

const supportApi = {
  list: () =>
    client.get<ApiOk<SupportTicket[]>>(`${BASE}/`).then((r) => r.data.data ?? []),

  create: (payload: { subject: string; message?: string; priority?: string; org_id?: string; org_name?: string }) =>
    client.post<ApiOk<SupportTicket>>(`${BASE}/`, payload).then((r) => r.data.data),
};

export default supportApi;
