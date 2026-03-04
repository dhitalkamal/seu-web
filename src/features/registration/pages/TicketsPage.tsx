import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useMyRegistrations } from "@/features/registration/hooks/useRegistrations";
import type { Registration } from "@/features/registration/types";
import checkinApi from "@/features/checkin/api/checkin.api";
import eventsApi from "@/features/events/api/events.api";
import paymentApi from "@/features/payment/api/payment.api";
import type { Event } from "@/features/events/types/event.types";
import type { PaymentOrder } from "@/features/payment/types";
import { QRCodeSVG } from "qrcode.react";

/**
 * Formats an ISO date string into a short human-readable form like "Oct 12, 2026".
 * @param dateStr - ISO date string.
 * @returns formatted date string.
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Builds a Google Calendar "add event" URL for a given event.
 * @param ev - the event to link to.
 * @returns full Google Calendar URL.
 */
function googleCalendarUrl(ev: Event): string {
  const start = new Date(ev.start_date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const end = new Date(ev.end_date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
    details: ev.description ?? "",
    location: ev.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Modal overlay that fetches and displays the QR token for a given registration.
 * @param registrationId - UUID of the registration to fetch the token for.
 * @param onClose - callback to dismiss the modal.
 */
function TicketQR({ registrationId, onClose }: { registrationId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["qr-token", registrationId],
    queryFn: () => checkinApi.getQrToken(registrationId),
    // keep token fresh for 4 minutes before refetching
    staleTime: 4 * 60 * 1000,
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 32,
          maxWidth: 360,
          width: "90%",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          Your QR code
        </div>
        {isLoading && <div style={{ padding: 32, color: "var(--on-mut)" }}>Generating...</div>}
        {isError && (
          <div style={{ padding: 16, color: "var(--error)" }}>Could not load QR code.</div>
        )}
        {data && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "16px 0",
                background: "white",
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <QRCodeSVG value={data.token} size={200} level="M" marginSize={0} />
            </div>
            <div style={{ fontSize: 11, color: "var(--on-mut)" }}>
              Show this to the event staff for check-in.
            </div>
            {data.expires_at && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--on-mut)",
                  marginTop: 6,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Expires: {new Date(data.expires_at).toLocaleString()}
              </div>
            )}
          </>
        )}
        <button
          className="btn-sm"
          style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/** My tickets page - shows upcoming registrations with countdown hero, 30-day timeline, and QR tokens. */
export default function TicketsPage() {
  const { toast, toastEl } = useToast();
  const navigate = useNavigate();
  const { data: registrations, isLoading } = useMyRegistrations();
  const [qrFor, setQrFor] = useState<string | null>(null);

  // * event detail cache keyed by event_id
  const [eventCache, setEventCache] = useState<Record<string, Event>>({});

  // * order cache keyed by registration_id
  const [orderCache, setOrderCache] = useState<Record<string, PaymentOrder>>({});

  // * Only show active (non-cancelled, non-no-show) registrations
  const active: Registration[] = (registrations ?? []).filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show"
  );

  // * fetch event details for each unique event_id (issues 23+25)
  useEffect(() => {
    const uniqueIds = [...new Set(active.map((r) => r.event_id))];
    for (const id of uniqueIds) {
      if (eventCache[id]) continue;
      eventsApi.getEvent(id).then((res) => {
        const ev = "data" in res ? res.data : (res as unknown as Event);
        if (ev) {
          setEventCache((prev) => ({ ...prev, [id]: ev }));
        }
      }).catch(() => {
        // leave cache empty for this id; UI falls back to truncated UUID
      });
    }
  // only re-run when the set of registration IDs changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.map((r) => r.event_id).join(",")]);

  // * fetch my orders once to enable receipt lookup (issue 24)
  useEffect(() => {
    if (active.length === 0) return;
    paymentApi.listMyOrders().then((orders) => {
      const map: Record<string, PaymentOrder> = {};
      for (const o of orders) {
        if (o.registration_id) map[o.registration_id] = o;
      }
      setOrderCache(map);
    }).catch(() => {
      // orders unavailable - receipt button will fall back to toast
    });
  // run once when registrations load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length]);

  const today = new Date();

  // * Nearest upcoming registration (by created_at as proxy; real event date unknown without join)
  const next = active.length > 0 ? active[0] : null;

  // * Build timeline dots - place each ticket on a 30-day strip by created_at offset
  const stripEnd = new Date(today);
  stripEnd.setDate(stripEnd.getDate() + 29);
  const stripLabel = `${today.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} to ${stripEnd.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`;

  /**
   * Open a Google Calendar link for the next event if event details are loaded.
   * Falls back to toast if event data is not yet cached.
   */
  function handleAddToCalendar() {
    if (!next) return;
    const ev = eventCache[next.event_id];
    if (!ev) {
      toast("Loading event details...");
      return;
    }
    window.open(googleCalendarUrl(ev), "_blank", "noopener");
  }

  /**
   * Navigate to the payment success page for the first available order,
   * or toast if no orders have been placed.
   */
  function handleReceipts() {
    // find any active registration that has an order
    const regWithOrder = active.find((r) => orderCache[r.id]);
    if (regWithOrder) {
      navigate(`/payment/success?orderId=${orderCache[regWithOrder.id].id}`);
    } else {
      toast("No receipt available");
    }
  }

  return (
    <AppLayout variant="user">
      {toastEl}
      {/* qr modal */}
      {qrFor && <TicketQR registrationId={qrFor} onClose={() => setQrFor(null)} />}
      <PH
        crumbs={["Tickets"]}
        title="My tickets"
        sub="Your upcoming registrations."
        actions={
          <>
            {/* add to calendar - generates Google Calendar URL (issue 24) */}
            <button className="btn-sm" onClick={handleAddToCalendar}>
              <MS n="calendar_add_on" size={13} />
              Add to calendar
            </button>
            {/* receipts - navigate to order or toast (issue 24) */}
            <button className="btn-sm" onClick={handleReceipts}>
              <MS n="download" size={13} />
              Receipts
            </button>
          </>
        }
      />

      {isLoading && (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--on-mut)" }}>
          Loading tickets...
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <MS n="confirmation_number" size={32} />
          <div
            style={{ marginTop: 12, fontWeight: 600, fontSize: 16, fontFamily: "Space Grotesk" }}
          >
            No tickets yet
          </div>
          <div style={{ color: "var(--on-mut)", fontSize: 13, marginTop: 4 }}>
            Register for an event to see your tickets here.
          </div>
        </div>
      )}

      {/* countdown hero */}
      {next && (
        <div
          style={{
            background: "linear-gradient(135deg,#050a26,#121d3f)",
            color: "white",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 18,
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "120px 1fr auto",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--tertiary)",
                marginBottom: 6,
              }}
            >
              Next ticket
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                fontSize: 54,
                letterSpacing: "-0.045em",
                lineHeight: 0.9,
              }}
            >
              {String(active.length).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              active
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--tertiary)",
                marginBottom: 6,
              }}
            >
              Registration
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                fontSize: 24,
                letterSpacing: "-0.03em",
                marginBottom: 8,
              }}
            >
              {next.registration_code}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Registered {fmtDate(next.created_at)} · Qty {next.quantity} · {next.status}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn-sm"
              style={{ background: "white", color: "var(--primary)", borderColor: "transparent" }}
              onClick={() => setQrFor(next.id)}
            >
              <MS n="qr_code_2" size={13} />
              Show QR
            </button>
            <button
              className="btn-sm"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                borderColor: "rgba(255,255,255,0.15)",
              }}
              onClick={() => toast("Directions opened")}
            >
              <MS n="directions" size={13} />
              Directions
            </button>
          </div>
        </div>
      )}

      {/* 30-day timeline strip */}
      {active.length > 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">Your next 30 days</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--on-mut)",
              }}
            >
              {stripLabel}
            </span>
          </div>
          <div className="panel-body" style={{ padding: "14px 18px 20px" }}>
            <div style={{ position: "relative", height: 54, paddingTop: 8 }}>
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "var(--mid)",
                  borderRadius: 999,
                }}
              />
              {[0, 7, 14, 21, 28].map((d) => {
                const dt = new Date(today);
                dt.setDate(dt.getDate() + d);
                return (
                  <div
                    key={d}
                    style={{
                      position: "absolute",
                      top: 36,
                      left: `${(d / 29) * 100}%`,
                      transform: "translateX(-50%)",
                      fontSize: 10,
                      color: "var(--on-mut)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {dt.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </div>
                );
              })}
              {/* today marker */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: "0%",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#e83151",
                  border: "3px solid white",
                  boxShadow: "0 0 0 2px #e83151",
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ticket cards */}
      {active.map((reg) => {
        const ev = eventCache[reg.event_id];
        const order = orderCache[reg.id];
        return (
          <div
            key={reg.id}
            className="panel"
            style={{
              padding: 0,
              marginBottom: 12,
              display: "grid",
              gridTemplateColumns: "1fr",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 18 }}>
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 9.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--secondary)",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {/* show event title if fetched, else short UUID (issues 23+25) */}
                {ev ? ev.title : `Event ${reg.event_id.slice(0, 8)}`}
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: "-0.025em",
                  marginBottom: 5,
                }}
              >
                {reg.registration_code}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: "var(--on-var)",
                  marginBottom: 10,
                }}
              >
                <span>{fmtDate(reg.created_at)}</span>
                <span>·</span>
                <span>Qty {reg.quantity}</span>
                {ev && (
                  <>
                    <span>·</span>
                    <span>{ev.location}</span>
                  </>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 10,
                  borderTop: "1px solid var(--outline)",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* add to calendar for this specific ticket (issue 24) */}
                  {ev && (
                    <button
                      className="btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => window.open(googleCalendarUrl(ev), "_blank", "noopener")}
                    >
                      <MS n="calendar_add_on" size={12} />
                      Calendar
                    </button>
                  )}
                  {/* receipt for this specific ticket (issue 24) */}
                  <button
                    className="btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={() => {
                      if (order) {
                        navigate(`/payment/success?orderId=${order.id}`);
                      } else {
                        toast("No receipt available");
                      }
                    }}
                  >
                    <MS n="receipt" size={12} />
                    Receipt
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="btn-sm"
                    onClick={() => setQrFor(reg.id)}
                    style={{ fontSize: 11 }}
                  >
                    <MS n="qr_code_2" size={12} />
                    Show QR
                  </button>
                  <span
                    className={`pill ${reg.status === "confirmed" ? "active" : reg.status === "pending" ? "draft" : "muted"}`}
                  >
                    {reg.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </AppLayout>
  );
}
