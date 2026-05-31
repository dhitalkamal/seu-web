import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import checkinApi from "../api/checkin.api";
import eventsApi from "@/features/events/api/events.api";

type RecentEntry = {
  registration_id: string;
  checked_in_at: string;
  error?: string;
  method: string;
};

export default function CheckinConsolePage() {
  const { toast, toastEl } = useToast();
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: eventsPage } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
  const events = eventsPage?.results ?? [];

  const statQuery = useQuery({
    queryKey: ["checkin-stats", eventId],
    queryFn: () => checkinApi.getEventStats(eventId),
    enabled: !!eventId,
    refetchInterval: 10_000,
  });

  const checkInMutation = useMutation({
    mutationFn: (payload: { registration_code: string; method: string }) =>
      checkinApi.checkIn({
        registration_code: payload.registration_code,
        event_id: eventId,
        method: payload.method,
      }),
    onSuccess: (result) => {
      setRecent((prev) => [
        {
          ...result,
          method: "check",
          checked_in_at: result.checked_in_at ?? new Date().toISOString(),
        },
        ...prev.slice(0, 29),
      ]);
      toast("Checked in successfully");
      setCode("");
      statQuery.refetch();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Check-in failed";
      const isDuplicate = msg.toLowerCase().includes("already");
      setRecent((prev) => [
        {
          registration_id: code.slice(0, 12),
          checked_in_at: new Date().toISOString(),
          error: isDuplicate ? "Already checked in" : msg,
          method: "error",
        },
        ...prev.slice(0, 29),
      ]);
      toast(msg);
      setCode("");
    },
  });

  function handleManualSubmit() {
    if (!code.trim() || !eventId) return;
    checkInMutation.mutate({ registration_code: code.trim(), method: "manual" });
  }

  function handleQrScan(decodedText: string) {
    if (!eventId || checkInMutation.isPending) return;
    setCode(decodedText);
    checkInMutation.mutate({ registration_code: decodedText, method: "qr" });
  }

  // qr scanner lifecycle
  useEffect(() => {
    if (!scannerActive) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const containerId = "qr-scanner-container";
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleQrScan(decodedText);
        },
        () => {}
      )
      .catch((err) => {
        toast(`Camera error: ${err}`);
        setScannerActive(false);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [scannerActive, eventId]);

  const stats = statQuery.data;
  const checkedIn = stats?.checked_in ?? 0;
  const total = stats?.total ?? 0;
  const remaining = stats?.remaining ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const selectedEvent = events.find((e) => e.id === eventId);

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Check-in"]}
        title="Check-in console"
        sub="Scan QR codes or enter registration codes to check attendees in."
        actions={
          <button className="btn-sm" onClick={() => statQuery.refetch()}>
            <MS n="refresh" size={13} />
            Refresh
          </button>
        }
      />

      {/* event selector */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div
          className="panel-body"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}
        >
          <MS n="event" size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--on-mut)",
                marginBottom: 4,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Select event
            </label>
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setRecent([]);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--mid)",
                background: "var(--low)",
                color: "var(--on-bg)",
                fontSize: 14,
                fontFamily: "Manrope, sans-serif",
                outline: "none",
              }}
            >
              <option value="">Choose an event...</option>
              {events
                .filter((e) => e.status === "published")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} - {new Date(e.start_date).toLocaleDateString()}
                  </option>
                ))}
            </select>
          </div>
          {selectedEvent && (
            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--on-bg)" }}>
                {selectedEvent.registered_count} / {selectedEvent.capacity}
              </div>
              <div>registered</div>
            </div>
          )}
        </div>
      </div>

      {!eventId && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-body" style={{ padding: "48px 0", textAlign: "center" }}>
            <MS
              n="qr_code_scanner"
              size={48}
              style={{
                display: "block",
                margin: "0 auto 12px",
                color: "var(--on-mut)",
                opacity: 0.3,
              }}
            />
            <p
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              Select an event to start
            </p>
            <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
              Choose an event from the dropdown above to begin checking in attendees.
            </p>
          </div>
        </div>
      )}

      {eventId && (
        <>
          {/* kpi row */}
          <div className="kpi-grid">
            <KPI
              icon="how_to_reg"
              color="mnt"
              label="Checked in"
              value={checkedIn.toString()}
              trend={`${pct}%`}
              trendKind={pct > 50 ? "up" : "steady"}
            />
            <KPI icon="group" color="lav" label="Registered" value={total.toString()} />
            <KPI
              icon="pending"
              color="pch"
              label="Remaining"
              value={remaining.toString()}
              trendKind={remaining > 0 ? "warn" : "steady"}
            />
            <KPI
              icon="check_circle"
              color="nav"
              label="This session"
              value={recent.filter((r) => !r.error).length.toString()}
            />
          </div>

          <div className="chart-grid-2">
            {/* scanner + manual entry panel */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <MS
                    n="qr_code_scanner"
                    size={16}
                    style={{ verticalAlign: "middle", marginRight: 6 }}
                  />
                  {scannerActive ? "Camera scanner" : "Manual entry"}
                </span>
                <button
                  className={`btn-sm ${scannerActive ? "danger" : "primary"}`}
                  onClick={() => setScannerActive(!scannerActive)}
                  style={{ fontSize: 11, padding: "5px 12px" }}
                >
                  <MS n={scannerActive ? "videocam_off" : "videocam"} size={13} />
                  {scannerActive ? "Stop camera" : "Start camera"}
                </button>
              </div>
              <div
                className="panel-body"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* qr scanner viewport */}
                {scannerActive && (
                  <div
                    ref={scannerContainerRef}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "2px solid var(--primary)",
                      background: "#000",
                    }}
                  >
                    <div id="qr-scanner-container" style={{ width: "100%" }} />
                  </div>
                )}

                {!scannerActive && (
                  <>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase" as const,
                          color: "var(--on-mut)",
                          marginBottom: 6,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Registration code or QR token
                      </label>
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                        placeholder="Type or scan registration code"
                        autoFocus
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: "1px solid var(--mid)",
                          background: "var(--low)",
                          color: "var(--on-bg)",
                          fontSize: 15,
                          outline: "none",
                          fontFamily: "'JetBrains Mono', monospace",
                          boxSizing: "border-box" as const,
                        }}
                      />
                    </div>
                    <button
                      className="btn-sm primary"
                      onClick={handleManualSubmit}
                      disabled={!code.trim() || checkInMutation.isPending}
                      style={{ justifyContent: "center", padding: "10px 0", fontSize: 14 }}
                    >
                      <MS n="how_to_reg" size={16} />
                      {checkInMutation.isPending ? "Checking in..." : "Check in"}
                    </button>
                  </>
                )}

                {/* attendance progress */}
                {total > 0 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        fontSize: 12,
                        color: "var(--on-mut)",
                      }}
                    >
                      <span>Attendance</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {checkedIn}/{total} ({pct}%)
                      </span>
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
              <div className="panel-body" style={{ padding: 0, maxHeight: 500, overflowY: "auto" }}>
                {recent.length === 0 ? (
                  <div
                    style={{
                      padding: "40px 0",
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                    }}
                  >
                    No check-ins yet. Scan a QR code or enter a registration code.
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
                        background: r.error ? "rgba(232,49,81,0.03)" : undefined,
                      }}
                    >
                      <MS
                        n={
                          r.error
                            ? r.error.includes("Already")
                              ? "warning"
                              : "error"
                            : "check_circle"
                        }
                        size={18}
                        style={{
                          color: r.error
                            ? r.error.includes("Already")
                              ? "#dba13d"
                              : "#e83151"
                            : "#16a34a",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {r.error ?? "Checked in"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--on-mut)",
                            fontFamily: "JetBrains Mono, monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.registration_id.slice(0, 12)}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            color: "var(--on-mut)",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {new Date(r.checked_in_at).toLocaleTimeString()}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: r.method === "qr" ? "rgba(67,56,202,0.1)" : "var(--low)",
                            color: r.method === "qr" ? "#4338ca" : "var(--on-mut)",
                            fontWeight: 600,
                          }}
                        >
                          {r.method === "qr" ? "QR" : r.method === "error" ? "" : "Manual"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
