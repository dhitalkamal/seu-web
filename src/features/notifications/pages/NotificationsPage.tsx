import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import notificationsApi from "@/features/notifications/api/notifications.api";
import type { Notification } from "@/features/notifications/api/notifications.api";

/**
 * Formats an ISO date string into a relative label or short date.
 * @param iso - ISO date string from the backend.
 * @returns human-readable label like "2h ago" or "May 12".
 */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Single notification row in the list.
 * @param n - notification object.
 * @param onMarkRead - callback invoked with the notification ID when clicked.
 * @param onAcknowledge - callback invoked when the acknowledge button is clicked.
 */
function NotificationRow({
  n,
  onMarkRead,
  onAcknowledge,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) {
  const isEventUpdate = n.notification_type === "event_update";

  return (
    <div
      onClick={() => !n.is_read && onMarkRead(n.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid var(--outline)",
        background: n.is_read ? "transparent" : "rgba(99,102,241,0.04)",
        cursor: n.is_read ? "default" : "pointer",
        transition: "background 150ms",
      }}
    >
      {/* unread dot */}
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        {n.is_read ? (
          <div style={{ width: 8, height: 8 }} />
        ) : (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4338ca",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: n.is_read ? 500 : 700,
            fontSize: 13.5,
            color: "var(--on-bg)",
            marginBottom: 3,
          }}
        >
          {n.title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.45,
          }}
        >
          {n.message}
        </div>
        {/* acknowledge button for event_update notifications */}
        {isEventUpdate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAcknowledge(n.id);
            }}
            style={{
              marginTop: 8,
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid var(--mid)",
              background: "transparent",
              color: "var(--on-var)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
            }}
          >
            Acknowledge update
          </button>
        )}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--on-mut)",
          fontFamily: "JetBrains Mono, monospace",
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {relativeTime(n.created_at)}
      </div>
    </div>
  );
}

/** Real notifications page - lists all in-app notifications with read/unread state. */
export default function NotificationsPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    // re-fetch every minute so new notifications appear without manual refresh
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => toast("Could not mark as read"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast("All notifications marked as read");
    },
    onError: () => toast("Could not mark all as read"),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast("Update acknowledged");
    },
    onError: () => toast("Could not acknowledge update"),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Notifications"]}
        title="Notifications"
        sub={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          unreadCount > 0 ? (
            <button
              className="btn-sm"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <MS n="done_all" size={13} />
              {markAllMutation.isPending ? "Marking..." : "Mark all read"}
            </button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="panel" style={{ padding: "48px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
            Loading notifications…
          </p>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="panel" style={{ padding: "56px 28px", textAlign: "center" }}>
          <span
            className="ms"
            style={{
              fontSize: 40,
              color: "var(--on-mut)",
              opacity: 0.4,
              display: "block",
              marginBottom: 14,
            }}
          >
            notifications_none
          </span>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 6,
            }}
          >
            No notifications yet
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            You'll see activity from events and your account here.
          </p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
              onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
