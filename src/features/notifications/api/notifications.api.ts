import client from "@/shared/api/client";

const BASE = "/notification/api/v1";

// * Types

/** Single notification from the backend. */
export type Notification = {
  id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  is_read: boolean;
  read_at: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

/** Per-type channel preferences. */
export type NotificationPreference = {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
};

type ApiOk<T> = { data: T; error: null | object; meta: object };

// * API

/** Notification service API calls - list, mark read, unread count, preferences. */
const notificationsApi = {
  /** Fetch all notifications for the authenticated user, newest first. */
  list: () =>
    client.get<ApiOk<Notification[]>>(`${BASE}/notifications/`).then((r) => r.data.data ?? []),

  /** Number of unread notifications. */
  unreadCount: () =>
    client
      .get<ApiOk<{ unread_count: number }>>(`${BASE}/notifications/unread-count/`)
      .then((r) => r.data.data?.unread_count ?? 0),

  /** Mark a single notification as read. */
  markRead: (id: string) =>
    client.post<ApiOk<Notification>>(`${BASE}/notifications/${id}/read/`).then((r) => r.data.data),

  /** Mark all notifications as read. */
  markAllRead: () =>
    client
      .post<ApiOk<{ updated: number }>>(`${BASE}/notifications/mark-all-read/`)
      .then((r) => r.data.data),

  /** Get channel preferences for a notification type. */
  getPreference: (notificationType: string) =>
    client
      .get<ApiOk<NotificationPreference>>(`${BASE}/preferences/${notificationType}/`)
      .then((r) => r.data.data),

  /** Update channel preferences for a notification type. */
  updatePreference: (
    notificationType: string,
    prefs: Partial<
      Pick<
        NotificationPreference,
        "email_enabled" | "push_enabled" | "sms_enabled" | "in_app_enabled"
      >
    >
  ) =>
    client
      .patch<ApiOk<NotificationPreference>>(`${BASE}/preferences/${notificationType}/`, prefs)
      .then((r) => r.data.data),

  /** Register a device token for push notifications. */
  registerDeviceToken: (token: string, platform: "web" | "android" | "ios") =>
    client.post("/notification/api/v1/device-tokens/", { token, platform }).then(() => void 0),

  /** Get the notification journey stages for an event. */
  getEventJourney: (eventId: string) =>
    client
      .get<{
        data: { stages: { name: string; status: string; sent_at: string | null }[] };
      }>(`/notification/api/v1/journeys/events/${eventId}/`)
      .then((r) => r.data.data),

  /** Create or replace the notification journey for an event. */
  createEventJourney: (
    eventId: string,
    stages: { name: string; delay_hours: number; template: string }[]
  ) =>
    client
      .post<{ data: unknown }>(`/notification/api/v1/journeys/events/${eventId}/`, { stages })
      .then((r) => r.data.data),

  /**
   * Acknowledge a notification by ID - used for event_update notifications.
   * @param id - UUID of the notification to acknowledge.
   */
  acknowledge: (id: string) =>
    client
      .post<ApiOk<Notification>>(`${BASE}/notifications/${id}/acknowledge/`)
      .then((r) => r.data.data),
};

export default notificationsApi;
