/** API calls for the registration feature. */

import client from "@/shared/api/client";
import type { RegisterResponse, Registration } from "../types";

const BASE = "/participation/api/v1";

/** A saved event record returned by the backend. */
export type SavedEvent = {
  id: string;
  event_id: string;
  created_at: string;
};

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
      .get<{ data: { token: string; expires_at: string } }>(
        `${BASE}/registrations/${id}/qr-token/`
      )
      .then((r) => r.data.data),

  /** Delete a registration record. */
  deleteRegistration: (id: string) => client.delete(`${BASE}/registrations/${id}/`),

  /** List all saved events for the authenticated user. */
  listSavedEvents: async (): Promise<SavedEvent[]> => {
    const r = await client.get<{ data: SavedEvent[] }>(`${BASE}/saved-events/`);
    return r.data?.data ?? (r.data as unknown as SavedEvent[]) ?? [];
  },

  /** Save an event by event ID. */
  saveEvent: async (eventId: string): Promise<SavedEvent> => {
    const r = await client.post<{ data: SavedEvent }>(`${BASE}/saved-events/`, {
      event_id: eventId,
    });
    return r.data?.data ?? (r.data as unknown as SavedEvent);
  },

  /** Unsave an event by saved-event record ID (the backend record, not the event ID). */
  unsaveEvent: async (savedEventId: string): Promise<void> => {
    await client.delete(`${BASE}/saved-events/${savedEventId}/`);
  },

  /**
   * Download a registration ticket as a PDF blob.
   * @param registrationId - UUID of the registration.
   * @returns raw PDF blob suitable for triggering a browser download.
   */
  downloadTicketPdf: async (registrationId: string): Promise<Blob> => {
    const r = await client.get<Blob>(`${BASE}/registrations/${registrationId}/ticket-pdf/`, {
      responseType: "blob",
    });
    return r.data;
  },

  /**
   * Initiate a ticket transfer to a recipient by email.
   * @param registrationId - UUID of the registration to transfer.
   * @param recipientEmail - email address of the intended recipient.
   * @returns backend response with transfer details.
   */
  initiateTransfer: async (registrationId: string, recipientEmail: string) => {
    const r = await client.post(`${BASE}/registrations/${registrationId}/transfer/`, {
      recipient_email: recipientEmail,
    });
    return r.data;
  },

  /**
   * Accept a pending ticket transfer using its token.
   * @param token - transfer token from the accept link.
   * @returns backend response confirming acceptance.
   */
  acceptTransfer: async (token: string) => {
    const r = await client.post(`${BASE}/transfers/${token}/accept/`);
    return r.data;
  },

  /**
   * Cancel a pending ticket transfer.
   * @param transferId - UUID of the transfer record.
   */
  cancelTransfer: async (transferId: string): Promise<void> => {
    await client.delete(`${BASE}/transfers/${transferId}/`);
  },
};

export default registrationApi;
