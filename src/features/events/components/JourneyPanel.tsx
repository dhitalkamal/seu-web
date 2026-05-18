import { useQuery } from "@tanstack/react-query";
import { MS } from "@/shared/components/v8";
import notificationsApi from "@/features/notifications/api/notifications.api";

type Props = {
  eventId: string;
};

/** Shows the notification journey stages for a single event as a small timeline. */
export default function JourneyPanel({ eventId }: Props) {
  const { data: journey, isLoading } = useQuery({
    queryKey: ["event-journey", eventId],
    queryFn: () => notificationsApi.getEventJourney(eventId),
    enabled: !!eventId,
  });

  const stages = journey?.stages ?? [];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--outline)",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 32,
      }}
    >
      <h4
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "-0.02em",
          marginBottom: 16,
          color: "var(--on-bg)",
        }}
      >
        Notification journey
      </h4>

      {isLoading && (
        <div style={{ fontSize: 13, color: "var(--on-mut)", padding: "8px 0" }}>Loading...</div>
      )}

      {!isLoading && stages.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--on-mut)", padding: "8px 0" }}>
          No journey stages configured.
        </div>
      )}

      {stages.map((stage, i) => {
        // pick icon and color based on stage status
        const isDone = stage.status === "sent";
        const isPending = stage.status === "pending";
        const iconName = isDone ? "check_circle" : isPending ? "schedule" : "cancel";
        const iconColor = isDone ? "#16a34a" : isPending ? "var(--on-mut)" : "var(--secondary)";

        return (
          <div
            key={i}
            className="flex items-start gap-3"
            style={{
              padding: "12px 0",
              borderTop: i === 0 ? "1px solid var(--outline)" : "1px solid var(--outline)",
            }}
          >
            {/* timeline dot */}
            <MS n={iconName} size={16} style={{ color: iconColor, flexShrink: 0, marginTop: 1 }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surf)" }}>
                {stage.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--on-mut)",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2,
                }}
              >
                {stage.sent_at
                  ? new Date(stage.sent_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : stage.status}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
