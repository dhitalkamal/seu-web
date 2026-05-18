/** API calls for volunteer roles and applications. */

import client from "@/shared/api/client";

const BASE = "/org/api/v1/volunteers";

export type VolunteerRole = {
  id: string;
  event_id: string;
  title: string;
  description: string;
  slots: number;
  filled: number;
  created_at: string;
};

export type VolunteerApplication = {
  id: string;
  role_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  message: string;
  created_at: string;
};

type ApiOk<T> = { data: T };

const volunteerRolesApi = {
  /** List all volunteer roles, optionally filtered by event. */
  listRoles: (eventId?: string) =>
    client
      .get<ApiOk<VolunteerRole[]>>(`${BASE}/roles/${eventId ? `?event_id=${eventId}` : ""}`)
      .then((r) => r.data.data ?? []),

  /** Create a new volunteer role for an event. */
  createRole: (payload: { event_id: string; title: string; description: string; slots: number }) =>
    client.post<ApiOk<VolunteerRole>>(`${BASE}/roles/`, payload).then((r) => r.data.data),

  /** Apply for a volunteer role. */
  apply: (roleId: string, message?: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/roles/${roleId}/apply/`, {
        message: message ?? "",
      })
      .then((r) => r.data.data),

  /** List all applications for a specific role. */
  listApplications: (roleId: string) =>
    client
      .get<ApiOk<VolunteerApplication[]>>(`${BASE}/roles/${roleId}/applications/`)
      .then((r) => r.data.data ?? []),

  /** Approve a volunteer application. */
  approve: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/approve/`)
      .then((r) => r.data.data),

  /** Reject a volunteer application. */
  reject: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/reject/`)
      .then((r) => r.data.data),

  /** Cancel a volunteer application. */
  cancel: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/cancel/`)
      .then((r) => r.data.data),
};

export default volunteerRolesApi;
