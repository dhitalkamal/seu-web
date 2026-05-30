/** API calls for volunteer roles, applications, shifts, checkin/checkout, certificates, and profile. */

import client from "@/shared/api/client";

const BASE = "/org/api/v1/volunteers";

export type VolunteerRole = {
  id: string;
  event_id: string;
  organization_id: string;
  name: string;
  title: string;
  description: string;
  capacity: number;
  slots: number;
  filled: number;
  is_active: boolean;
  created_at: string;
};

export type VolunteerApplication = {
  id: string;
  volunteer_role_id: string;
  role_id: string;
  user_id: string;
  event_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "confirmed" | "completed";
  message: string;
  created_at: string;
  check_in_at?: string;
  checked_in_at?: string;
  check_out_at?: string;
  checked_out_at?: string;
  rating?: number;
  feedback?: string;
  certificate_issued?: boolean;
};

export type VolunteerShift = {
  id: string;
  role_id: string;
  title: string;
  start_time: string;
  end_time: string;
  capacity: number;
  location?: string;
  created_at?: string;
};

export type VolunteerCertificate = {
  id: string;
  application_id: string;
  issued_at: string;
  title?: string;
  download_url?: string;
};

export type VolunteerProfile = {
  id: string;
  user_id: string;
  total_hours: number;
  skills: string[];
  availability: string;
  bio?: string;
};

type ApiOk<T> = { data: T };

const volunteerRolesApi = {
  /** List all volunteer roles, optionally filtered by event. */
  listRoles: (eventId?: string) =>
    client
      .get<ApiOk<VolunteerRole[]>>(`${BASE}/roles/${eventId ? `?event_id=${eventId}` : ""}`)
      .then((r) => r.data.data ?? []),

  /** Create a new volunteer role for an event. */
  createRole: (payload: { event_id: string; organization_id: string; name: string; description: string; capacity: number }) =>
    client.post<ApiOk<VolunteerRole>>(`${BASE}/roles/`, payload).then((r) => r.data.data),

  /** List the authenticated user's applications across all roles. */
  myApplications: () =>
    client.get<ApiOk<VolunteerApplication[]>>(`${BASE}/my/applications/`).then((r) => r.data.data ?? []),

  /** List the authenticated user's certificates. */
  myCertificates: () =>
    client.get<ApiOk<VolunteerCertificate[]>>(`${BASE}/my/certificates/`).then((r) => r.data.data ?? []),

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

  // * shift management

  /** List shifts for a given role. */
  listShifts: (roleId: string) =>
    client
      .get<ApiOk<VolunteerShift[]>>(`${BASE}/roles/${roleId}/shifts/list/`)
      .then((r) => r.data.data ?? []),

  /** Create a new shift for a role. */
  createShift: (
    roleId: string,
    data: {
      event_id: string;
      starts_at: string;
      ends_at: string;
      capacity: number;
      location?: string;
      description?: string;
    }
  ) =>
    client
      .post<ApiOk<VolunteerShift>>(`${BASE}/roles/${roleId}/shifts/`, data)
      .then((r) => r.data.data),

  /** Update an existing shift by id. */
  updateShift: (
    shiftId: string,
    data: Partial<{
      title: string;
      start_time: string;
      end_time: string;
      capacity: number;
      location: string;
    }>
  ) =>
    client
      .patch<ApiOk<VolunteerShift>>(`${BASE}/shifts/${shiftId}/`, data)
      .then((r) => r.data.data),

  /** Delete a shift by id. */
  deleteShift: (shiftId: string) => client.delete(`${BASE}/shifts/${shiftId}/`),

  // * checkin / checkout / rating

  /** Check in a volunteer application by id. */
  checkin: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/checkin/`)
      .then((r) => r.data.data),

  /** Check out a volunteer application by id. */
  checkout: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/checkout/`)
      .then((r) => r.data.data),

  /** Rate a volunteer after they complete a shift. */
  rate: (applicationId: string, payload: { rating: number; feedback?: string }) =>
    client
      .post<ApiOk<VolunteerApplication>>(`${BASE}/applications/${applicationId}/rate/`, payload)
      .then((r) => r.data.data),

  // * certificates

  /** Generate a certificate for a completed volunteer application. */
  generateCertificate: (applicationId: string) =>
    client
      .post<ApiOk<VolunteerCertificate>>(`${BASE}/applications/${applicationId}/certificate/`)
      .then((r) => r.data.data),

  /** Verify a certificate by its id. */
  verifyCertificate: (certificateId: string) =>
    client
      .get<
        ApiOk<VolunteerCertificate & { valid: boolean }>
      >(`${BASE}/certificates/${certificateId}/verify/`)
      .then((r) => r.data.data),

  // * profile

  /** Fetch the current volunteer's profile. */
  getProfile: () =>
    client.get<ApiOk<VolunteerProfile>>(`${BASE}/profile/`).then((r) => r.data.data),

  /** Partially update the current volunteer's profile. */
  updateProfile: (data: Partial<Pick<VolunteerProfile, "skills" | "availability" | "bio">>) =>
    client.patch<ApiOk<VolunteerProfile>>(`${BASE}/profile/`, data).then((r) => r.data.data),
};

export default volunteerRolesApi;
