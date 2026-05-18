import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import checkinApi, { type CheckInResult } from "../api/checkin.api";

/** Each entry in the recent list, extended with an optional error string. */
type RecentEntry = CheckInResult & { error?: string };

/** Live check-in console - manual entry, real-time stats, and recent activity feed. */
export default function CheckinConsolePage() {
  const { toast, toastEl } = useToast();

  const [code, setCode] = useState("");
  const [eventId, setEventId] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  // * Poll event stats every 10 seconds while an event is selected
  const statQuery = useQuery({
    queryKey: ["checkin-stats", eventId],
    queryFn: () => checkinApi.getEventStats(eventId),
    enabled: !!eventId,
    refetchInterval: 10_000,
  });

  const checkInMutation = useMutation({
    mutationFn: (registrationId: string) =>
      checkinApi.checkIn({ registration_id: registrationId, event_id: eventId }),
    onSuccess: (result) => {
      setRecent((prev) => [result, ...prev.slice(0, 19)]);
      if (result.already_checked_in) {
        toast("Already checked in");
      } else {
        toast(`Checked in: ${result.attendee_name}`);
      }
      setCode("");
    },
    onError: () => {
      const fallback: RecentEntry = {
        registration_id: code,
        attendee_name: "Unknown",
        event_title: "",
        checked_in_at: new Date().toISOString(),
        already_checked_in: false,
        error: "Not found",
      };
      setRecent((prev) => [fallback, ...prev.slice(0, 19)]);
      toast("Registration not found");
      setCode("");
    },
  });

  /** Fires the check-in mutation after basic guards. */
  function handleSubmit() {
    if (!code.trim()) return;
    if (!eventId.trim()) {
      toast("Enter an event ID first");
      return;
    }
    checkInMutation.mutate(code.trim());
  }

  const stats = statQuery.data;
  const checkedIn = stats?.checked_in ?? 0;
  const total = stats?.total ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Check-in"]}
        title="Check-in console"
        sub="Scan QR codes or enter registration IDs to check attendees in."
        actions={
          <button className="btn-sm" onClick={() => statQuery.refetch()}>
            <MS n="refresh" size={13} />
            Refresh stats
          </button>
        }
      />

      {/* kpi row */}
      <div className="kpi-grid">
        <KPI
          icon="how_to_reg"
          color="mnt"
          label="Checked in"
          value={checkedIn.toString()}
          trend={`${pct}% of total`}
          trendKind={pct > 50 ? "up" : "steady"}
        />
        <KPI icon="group" color="lav" label="Total registered" value={total.toString()} />
        <KPI
          icon="pending"
          color="pch"
          label="Remaining"
          value={(stats?.remaining ?? 0).toString()}
        />
        <KPI
          icon="check_circle"
          color="nav"
          label="This session"
          value={recent.filter((r) => !r.error && !r.already_checked_in).length.toString()}
        />
      </div>

      {/* main panels */}
      <div className="chart-grid-21">
        {/* manual entry */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Manual entry</span>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-lab">Event ID</label>
              <input
                className="field-in"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Paste event UUID"
              />
            </div>
            <div className="field">
              <label className="field-lab">Registration ID or QR code</label>
              <input
                className="field-in"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Scan or type registration ID"
                autoFocus
              />
            </div>
            {!eventId && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--warning)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Enter an event ID above before checking in.
              </div>
            )}
            <button
              className="btn-sm primary"
              onClick={handleSubmit}
              disabled={!code.trim() || !eventId || checkInMutation.isPending}
              style={{ justifyContent: "center" }}
            >
              <MS n="how_to_reg" size={13} />
              {checkInMutation.isPending ? "Checking in..." : "Check in"}
            </button>

            {/* attendance progress bar */}
            {total > 0 && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 12,
                    color: "var(--on-mut)",
                  }}
                >
                  <span>Attendance progress</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{pct}%</span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--low)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "linear-gradient(135deg,#16a34a,#22c55e)",
                      borderRadius: 4,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* recent check-ins feed */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Recent check-ins</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {recent.length}
            </span>
          </div>
          <div className="panel-body" style={{ padding: 0, maxHeight: 420, overflowY: "auto" }}>
            {recent.length === 0 ? (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                }}
              >
                No check-ins yet this session.
              </div>
            ) : (
              recent.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--outline)",
                  }}
                >
                  <MS
                    n={r.error ? "error" : r.already_checked_in ? "warning" : "check_circle"}
                    size={18}
                    style={{
                      color: r.error
                        ? "var(--error)"
                        : r.already_checked_in
                          ? "var(--warning)"
                          : "var(--success)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {r.error ? "Not found" : r.attendee_name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {r.registration_id.slice(0, 12)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--on-mut)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {new Date(r.checked_in_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
