import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import UserAvatar from "@/shared/components/UserAvatar";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import type { AttendeeMatch } from "@/features/intelligence/api/intelligence.api";

// * Score badge colors

/** Map a 0-1 score to a color pair for the badge. */
function scoreBadge(score: number): { bg: string; color: string } {
  if (score >= 0.7) return { bg: "#dcfce7", color: "#166534" };
  if (score >= 0.4) return { bg: "#fef9c3", color: "#854d0e" };
  return { bg: "#fee2e2", color: "#991b1b" };
}

/**
 * Who to Meet networking page - shows AI-ranked attendee matches for the
 * authenticated user at a specific event, with introduce actions and opt-in toggle.
 */
export default function EventConnectionsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [optInError, setOptInError] = useState(false);

  // * ranked matches
  const {
    data: connections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event-connections", eventId],
    queryFn: () => intelligenceApi.getConnections(eventId!),
    enabled: !!eventId,
    retry: false,
  });

  // detect 403 opt-in required
  const isOptInRequired =
    optInError || (error as { response?: { status?: number } })?.response?.status === 403;
  if (
    error &&
    !optInError &&
    (error as { response?: { status?: number } })?.response?.status === 403
  ) {
    setOptInError(true);
  }

  // * connection settings (org-level)
  const { data: settings } = useQuery({
    queryKey: ["connection-settings", eventId],
    queryFn: () => intelligenceApi.getConnectionSettings(eventId!),
    enabled: !!eventId,
  });

  // * introduce mutation
  const introduceMutation = useMutation({
    mutationFn: (userId: string) => intelligenceApi.introduceConnection(eventId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-connections", eventId] });
      toast("Introduction sent!");
    },
    onError: () => toast("Failed to send introduction"),
  });

  // * opt-in mutation - toggles the user's privacy setting so they can use Who to Meet
  const optInMutation = useMutation({
    mutationFn: () => intelligenceApi.updateConnectionSettings(eventId!, { enabled: true }),
    onSuccess: () => {
      setOptInError(false);
      qc.invalidateQueries({ queryKey: ["event-connections", eventId] });
      qc.invalidateQueries({ queryKey: ["connection-settings", eventId] });
      toast("Networking enabled - finding your matches...");
    },
    onError: () => toast("Could not enable networking"),
  });

  // * computed stats
  const introCount = connections.filter((c: AttendeeMatch) => c.is_introduced).length;
  const avgScore =
    connections.length > 0
      ? (
          connections.reduce((s: number, c: AttendeeMatch) => s + Number(c.match_score), 0) /
          connections.length
        ).toFixed(0)
      : "-";

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Events", "Who to Meet"]}
        title="Who to Meet"
        sub="AI-ranked attendee matches based on shared event history."
      />

      {/* KPI row */}
      <div className="kpi-grid">
        <KPI icon="people" color="lav" label="Matches" value={connections.length.toString()} />
        <KPI icon="handshake" color="pch" label="Introductions" value={introCount.toString()} />
        <KPI
          icon="speed"
          color="mnt"
          label="Avg match %"
          value={avgScore === "-" ? "-" : `${avgScore}%`}
        />
        <KPI
          icon="wifi_tethering"
          color="nav"
          label="Networking"
          value={isOptInRequired ? "Opt-in" : settings?.enabled ? "Active" : "Off"}
          trendKind={isOptInRequired ? "warn" : "steady"}
        />
      </div>

      {/* opt-in banner when user hasn't enabled networking */}
      {isOptInRequired && (
        <div
          style={{
            background: "linear-gradient(135deg, #312e81, #4338ca)",
            color: "white",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              flex: "0 0 48px",
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <MS n="diversity_3" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              Enable Networking
            </p>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Manrope, sans-serif",
                lineHeight: 1.5,
              }}
            >
              Opt in to see AI-ranked attendee matches based on shared event history. Your profile
              will also become visible to other opted-in attendees.
            </p>
          </div>
          <button
            onClick={() => optInMutation.mutate()}
            disabled={optInMutation.isPending}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              background: "white",
              color: "#4338ca",
              fontFamily: "Manrope, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              opacity: optInMutation.isPending ? 0.6 : 1,
            }}
          >
            {optInMutation.isPending ? "Enabling..." : "Enable"}
          </button>
        </div>
      )}

      {/* matches table */}
      {!isOptInRequired && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Your matches</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {connections.length} people
            </span>
          </div>
          <div className="panel-body flush">
            {isLoading ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Finding your matches...
              </div>
            ) : connections.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <MS
                  n="people_outline"
                  size={32}
                  style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }}
                />
                <p
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 6,
                  }}
                >
                  No matches yet
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--on-mut)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  Matches appear as more attendees opt in and register for events.
                </p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Match score</th>
                    <th>Shared events</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {connections
                    .sort(
                      (a: AttendeeMatch, b: AttendeeMatch) =>
                        Number(b.match_score) - Number(a.match_score)
                    )
                    .map((c: AttendeeMatch) => {
                      const score = Math.round(Number(c.match_score) * 100);
                      const badge = scoreBadge(Number(c.match_score));
                      return (
                        <tr key={c.match_id}>
                          {/* avatar + user id */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <UserAvatar uid={c.user_id} size={32} radius={8} />
                              <span
                                style={{
                                  fontFamily: "JetBrains Mono, monospace",
                                  fontSize: 12,
                                  color: "var(--on-var)",
                                }}
                              >
                                {c.user_id?.slice(0, 12) ?? "..."}
                              </span>
                            </div>
                          </td>

                          {/* score badge */}
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: "'Space Grotesk', sans-serif",
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {score}%
                            </span>
                          </td>

                          {/* shared events signal */}
                          <td
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 12,
                              color: "var(--on-mut)",
                            }}
                          >
                            {c.match_signals?.shared_events ?? 0} events
                          </td>

                          {/* introduced status */}
                          <td>
                            {c.is_introduced ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#16a34a",
                                }}
                              >
                                <MS n="check_circle" size={14} /> Introduced
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--on-mut)" }}>Not yet</span>
                            )}
                          </td>

                          {/* action */}
                          <td>
                            {!c.is_introduced && (
                              <button
                                className="btn-sm"
                                onClick={() => introduceMutation.mutate(c.user_id)}
                                disabled={introduceMutation.isPending}
                                style={{ fontSize: 11 }}
                              >
                                <MS n="handshake" size={12} />
                                Introduce
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
