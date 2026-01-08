import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import client from "@/shared/api/client";

interface Notification {
  id: string;
  notification_type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  is_read: boolean;
  read_at: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

function fetchNotifications(): Promise<Notification[]> {
  return client.get<{ data: Notification[] }>("/notification/api/v1/notifications/").then((r) => r.data.data);
}

function markAllRead() {
  return client.post<{ data: { updated: number } }>("/notification/api/v1/notifications/mark-all-read/").then((r) => r.data.data);
}

/** In-app notification centre — SEU v8 design. */
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
      actions={
        unread > 0 ? (
          <button
            onClick={() => markAllMutation.mutate()}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: "1px solid var(--outline)",
              background: "white",
              fontSize: 12.5,
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              color: "var(--on-var)",
              cursor: "pointer",
            }}
          >
            Mark all read
          </button>
        ) : undefined
      }
    >
      <div style={{ maxWidth: 720 }}>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: 64, borderRadius: 12, background: "var(--surface)" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="text-center py-16"
            style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 14 }}
          >
            <span className="ms" style={{ fontSize: 40, color: "var(--high)", display: "block", marginBottom: 12 }}>
              notifications_none
            </span>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "var(--on-mut)" }}>
              No notifications yet.
            </p>
            <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif", marginTop: 6 }}>
              Security alerts and event updates will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className="flex items-start gap-4"
                style={{
                  padding: "16px 20px",
                  borderTop: i > 0 ? "1px solid var(--outline)" : "none",
                  background: n.is_read ? "transparent" : "rgba(18,29,63,0.025)",
                  transition: "background 200ms",
                }}
              >
                {/* type icon */}
                <div
                  className="grid place-items-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: n.is_read ? "var(--low)" : "rgba(18,29,63,0.08)",
                    marginTop: 2,
                  }}
                >
                  <span className="ms" style={{ fontSize: 18, color: n.is_read ? "var(--on-mut)" : "var(--primary)" }}>
                    {n.channel === "email" ? "mail" : n.channel === "push" ? "notifications" : "info"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      style={{
                        fontWeight: n.is_read ? 500 : 700,
                        fontSize: 13.5,
                        color: "var(--on-bg)",
                        fontFamily: "Manrope, sans-serif",
                        marginBottom: 3,
                      }}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--secondary)", flexShrink: 0, marginTop: 5 }} />
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif", lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "var(--on-mut)",
                      marginTop: 6,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
