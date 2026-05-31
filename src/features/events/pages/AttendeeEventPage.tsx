import { lazy, Suspense, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useEvent } from "@/features/events/hooks/useEvents";
import { useAuthStore } from "@/shared/store/auth.store";
import registrationApi from "@/features/registration/api/registration.api";
import apiClient from "@/shared/api/client";

const EventMap = lazy(() => import("@/shared/components/EventMap"));

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function AttendeeEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: event, isLoading } = useEvent(id ?? "");
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [networkingOptIn, setNetworkingOptIn] = useState(false);

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationApi.listMine(),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const alreadyRegistered = myRegistrations.some(
    (r) => r.event_id === id && (r.status === "confirmed" || r.status === "checked_in")
  );

  const { data: tiers = [] } = useQuery({
    queryKey: ["ticket-tiers", id],
    queryFn: async () => {
      const r = await apiClient.get(`/participation/api/v1/events/${id}/ticket-tiers/`);
      return (r.data?.data ?? []) as {
        id: string;
        name: string;
        price: string;
        capacity: number;
        description: string;
      }[];
    },
    enabled: !!id,
  });

  async function handleRegister() {
    if (!id || !user) return;
    if (alreadyRegistered) {
      setRegError("You are already registered for this event.");
      return;
    }
    setRegistering(true);
    setRegError("");
    try {
      if (!event?.is_free) {
        navigate(
          `/checkout?event_id=${id}&subtotal=${event?.price}&organization_id=${event?.organization_id ?? ""}`
        );
        return;
      }
      await registrationApi.register({ event_id: id, networking_opt_in: networkingOptIn });
      setRegSuccess(true);
    } catch (err: unknown) {
      setRegError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Registration failed"
      );
    } finally {
      setRegistering(false);
    }
  }

  if (isLoading)
    return (
      <AppLayout variant="user">
        <div className="animate-pulse" style={{ maxWidth: 960, margin: "0 auto" }}>
          <div
            style={{ height: 300, borderRadius: 16, background: "var(--low)", marginBottom: 20 }}
          />
          <div style={{ height: 24, width: "40%", borderRadius: 8, background: "var(--low)" }} />
        </div>
      </AppLayout>
    );
  if (!event)
    return (
      <AppLayout variant="user">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--on-mut)" }}>
          Event not found.
        </div>
      </AppLayout>
    );

  const priceLabel = event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`;
  const fillPct =
    event.capacity > 0
      ? Math.min(100, Math.round((event.registered_count / event.capacity) * 100))
      : 0;

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH crumbs={["Events", event.title]} title="" sub="" />

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* cover banner */}
        <div
          style={{
            height: 320,
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
            marginBottom: 24,
            backgroundImage: event.cover_image
              ? `url(${event.cover_image})`
              : "linear-gradient(135deg,#050a26,#121d3f)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
            }}
          />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 28px" }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: "white",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              {event.title}
            </h1>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                <MS n="calendar_today" size={14} />
                {fmtDate(event.start_date)}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                <MS n="schedule" size={14} />
                {fmtTime(event.start_date)} - {fmtTime(event.end_date)}
              </span>
              {event.location && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 13,
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  <MS n="location_on" size={14} />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* about */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">About this event</span>
              </div>
              <div className="panel-body">
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--on-var)",
                    lineHeight: 1.7,
                    fontFamily: "Manrope, sans-serif",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {event.description}
                </p>
              </div>
            </div>

            {/* venue + map */}
            {event.location && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">
                    <MS
                      n="location_on"
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 6, color: "var(--secondary)" }}
                    />
                    Venue
                  </span>
                </div>
                <div className="panel-body">
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                      marginBottom: event.latitude ? 12 : 0,
                    }}
                  >
                    {event.location}
                  </p>
                  {event.latitude && (
                    <div
                      style={{
                        height: 200,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid var(--mid)",
                      }}
                    >
                      <Suspense
                        fallback={<div style={{ height: 200, background: "var(--low)" }} />}
                      >
                        <EventMap
                          latitude={Number(event.latitude)}
                          longitude={Number(event.longitude)}
                          title={event.location}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ticket tiers */}
            {tiers.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">
                    <MS
                      n="confirmation_number"
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 6, color: "var(--primary)" }}
                    />
                    Ticket Options
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10.5,
                      color: "var(--on-mut)",
                    }}
                  >
                    {tiers.length} tiers
                  </span>
                </div>
                <div className="panel-body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {tiers.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          border: "1px solid var(--mid)",
                          borderRadius: 12,
                          padding: "14px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Space Grotesk',sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          {t.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--primary)",
                            marginBottom: 4,
                          }}
                        >
                          NPR {parseFloat(t.price).toLocaleString()}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--on-mut)" }}>
                          {t.capacity} available
                        </p>
                        {t.description && (
                          <p style={{ fontSize: 11, color: "var(--on-var)", marginTop: 4 }}>
                            {t.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* online */}
            {event.is_online && event.online_url && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">
                    <MS
                      n="videocam"
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 6, color: "#4338ca" }}
                    />
                    Online Event
                  </span>
                </div>
                <div className="panel-body">
                  <a
                    href={event.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "var(--primary)" }}
                  >
                    {event.online_url}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* right - sticky registration */}
          <div style={{ position: "sticky", top: 80 }}>
            <div className="panel">
              <div
                className="panel-body"
                style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px" }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "var(--primary)",
                      marginBottom: 2,
                    }}
                  >
                    {priceLabel}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    per ticket
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span style={{ color: "var(--on-var)" }}>Capacity</span>
                    <span style={{ fontWeight: 600 }}>{event.capacity}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <span style={{ color: "var(--on-var)" }}>Registered</span>
                    <span style={{ fontWeight: 600 }}>{event.registered_count}</span>
                  </div>
                  <div
                    style={{ height: 4, background: "var(--low)", borderRadius: 2, marginTop: 4 }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${fillPct}%`,
                        background: fillPct > 85 ? "var(--secondary)" : "var(--primary)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono',monospace",
                      textAlign: "right",
                    }}
                  >
                    {fillPct}% filled
                  </p>
                </div>

                {regError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--secondary)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    {regError}
                  </p>
                )}

                {/* networking opt-in toggle */}
                {!alreadyRegistered && !regSuccess && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: networkingOptIn ? "rgba(100,130,255,0.06)" : "var(--low)",
                      border: `1px solid ${networkingOptIn ? "rgba(100,130,255,0.25)" : "var(--outline)"}`,
                      cursor: "pointer",
                      transition: "all 200ms",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={networkingOptIn}
                      onChange={(e) => setNetworkingOptIn(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#050a26", cursor: "pointer" }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--on-bg)",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        Enable networking
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--on-mut)",
                          fontFamily: "Manrope, sans-serif",
                          marginTop: 1,
                        }}
                      >
                        Get matched with attendees to meet at this event
                      </p>
                    </div>
                  </label>
                )}

                {regSuccess || alreadyRegistered ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      textAlign: "center",
                    }}
                  >
                    <MS
                      n="check_circle"
                      size={24}
                      style={{ color: "#16a34a", display: "block", margin: "0 auto 6px" }}
                    />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>
                      Already Registered
                    </p>
                    <button
                      onClick={() => navigate("/tickets")}
                      className="btn-sm primary"
                      style={{ fontSize: 12 }}
                    >
                      View My Tickets
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 12,
                      border: "none",
                      background: registering ? "var(--mid)" : "#050a26",
                      color: registering ? "var(--on-mut)" : "white",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: registering ? "not-allowed" : "pointer",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    {registering
                      ? "Processing..."
                      : event.is_free
                        ? "Register Now"
                        : `Buy Ticket - ${priceLabel}`}
                  </button>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      registrationApi
                        .saveEvent(id!)
                        .then(() => toast("Event saved"))
                        .catch(() => toast("Failed to save event"));
                    }}
                    className="btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <MS n="bookmark_add" size={14} /> Save
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <MS n="share" size={14} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
