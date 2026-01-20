/** API calls for organisation CRUD, lifecycle management, and document uploads. */

import client from "@/shared/api/client";
import type {
  Organisation,
  OrgMember,
  OrgDocument,
  CreateOrgRequest,
  AddMemberRequest,
  UploadDocRequest,
} from "@/features/orgs/types/org.types";

const BASE = "/org/api/v1/organisations";

/**
 * Unwraps the standard { data: T } envelope the management-service returns.
 * Every endpoint except DELETE returns this shape.
 *
 * @param res - Axios response with envelope
 * @returns The unwrapped payload
 */
function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

const orgApi = {
  // * CRUD

  /** Fetch all orgs the current user belongs to. */
  list: () => client.get<{ data: Organisation[] }>(BASE + "/").then(unwrap),

  /** Fetch a single org by ID. */
  get: (orgId: string) => client.get<{ data: Organisation }>(`${BASE}/${orgId}/`).then(unwrap),

  /** Create a new organisation - starts in pending_review. */
  create: (payload: CreateOrgRequest) =>
    client.post<{ data: Organisation }>(BASE + "/", payload).then(unwrap),

  /** Partial update an existing organisation. */
  update: (orgId: string, payload: Partial<CreateOrgRequest>) =>
    client.patch<{ data: Organisation }>(`${BASE}/${orgId}/`, payload).then(unwrap),

  /** Soft-delete an organisation (HTTP 204, no body). */
  remove: (orgId: string) => client.delete(`${BASE}/${orgId}/delete/`).then(() => void 0),

  // * Members

  /** Add a member to the organisation. */
  addMember: (orgId: string, payload: AddMemberRequest) =>
    client.post<{ data: OrgMember }>(`${BASE}/${orgId}/members/`, payload).then(unwrap),

  // * Documents

  /** List all documents for an organisation. */
  listDocuments: (orgId: string) =>
    client.get<{ data: OrgDocument[] }>(`${BASE}/${orgId}/documents/`).then(unwrap),

  /** Upload a document record for an organisation (metadata only, no file). */
  uploadDocument: (orgId: string, payload: UploadDocRequest) =>
    client.post<{ data: OrgDocument }>(`${BASE}/${orgId}/documents/`, payload).then(unwrap),

  /** Upload a real file to MinIO via the management service and save the document record. */
  uploadDocumentFile: (orgId: string, file: File, docType: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    return client
      .post<{ data: OrgDocument }>(`${BASE}/${orgId}/documents/upload/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap);
  },

  /** Delete a document by ID. */
  deleteDocument: (orgId: string, docId: string) =>
    client.delete(`${BASE}/${orgId}/documents/${docId}/`).then(() => void 0),

  // * Lifecycle transitions (typically superadmin-only, but typed here for completeness)

  /** Approve a pending org - transitions pending_review to active. */
  approve: (orgId: string) =>
    client.post<{ data: Organisation }>(`${BASE}/${orgId}/approve/`).then(unwrap),

  /** Reject a pending org - transitions pending_review to suspended. */
  reject: (orgId: string) =>
    client.post<{ data: Organisation }>(`${BASE}/${orgId}/reject/`).then(unwrap),

  /** Suspend an active org. */
  suspend: (orgId: string) =>
    client.post<{ data: Organisation }>(`${BASE}/${orgId}/suspend/`).then(unwrap),

  /** Reinstate a suspended org. */
  reinstate: (orgId: string) =>
    client.post<{ data: Organisation }>(`${BASE}/${orgId}/reinstate/`).then(unwrap),
};

export default orgApi;
