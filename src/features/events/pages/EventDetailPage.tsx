import { useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui";
import PublicLayout from "@/shared/layouts/PublicLayout";
import AppLayout from "@/shared/layouts/AppLayout";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import { useAuthStore } from "@/shared/store/auth.store";
import registrationApi from "@/features/registration/api/registration.api";
import JourneyPanel from "@/features/events/components/JourneyPanel";

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  published: { bg: "#dcfce7", color: "#16a34a" },
  draft: { bg: "var(--low)", color: "var(--on-var)" },
  cancelled: { bg: "rgba(232,49,81,0.1)", color: "var(--secondary)" },
  completed: { bg: "rgba(18,29,63,0.08)", color: "var(--primary)" },
};

type LayoutProps = {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isOrgContext: boolean;
};

/** Picks the right shell based on auth state and route context. */
function Layout({ children, isAuthenticated, isOrgContext }: LayoutProps) {
  if (isAuthenticated) {
    return <AppLayout variant={isOrgContext ? "org" : "user"}>{children}</AppLayout>;
  }
  return <PublicLayout>{children}</PublicLayout>;
}

/** Public event detail -full-width hero + two-column body + sticky registration rail. */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { data: event, isLoading } = useEvent(id ?? "");
  const { publishMutation, deleteMutation } = useEventMutations();

  // ! hooks must be called before any early return to satisfy Rules of Hooks
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // when accessed via /org/events/:id use the org shell + org navigation targets
  const isOrgContext = location.pathname.startsWith("/org/");

  if (isLoading) {
    return (
      <Layout isAuthenticated={isAuthenticated} isOrgContext={isOrgContext}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
          <div className="animate-pulse space-y-4">
            <div style={{ height: 420, borderRadius: 24, background: "var(--low)" }} />
            <div style={{ height: 24, width: "40%", borderRadius: 8, background: "var(--low)" }} />
            <div style={{ height: 16, width: "70%", borderRadius: 8, background: "var(--low)" }} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout isAuthenticated={isAuthenticated} isOrgContext={isOrgContext}>
        <div className="text-center py-24">
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--on-mut)",
            }}
          >
            Event not found.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-sm font-semibold text-[var(--primary)] no-underline hover:underline"
          >
            Back to events
          </Link>
        </div>
      </Layout>
    );
  }

  const isOrganiser = user?.id === event.organiser_id;
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const spots = event.capacity - event.registered_count;
  const chip = STATUS_CHIP[event.status] ?? STATUS_CHIP.draft;
  const priceDisplay = event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`;

  /** Register via participation service, then redirect to checkout (or confirm if free). */
  async function handleRegister() {
    if (!event) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setRegistering(true);
    setRegError("");
    try {
      const result = await registrationApi.register({ event_id: event.id });

      // ! if the user got waitlisted, don't go to checkout
      if ("waitlisted" in result && result.waitlisted) {
        navigate("/tickets");
        return;
      }

      // * free events -registration is enough, no payment needed
      if (event.is_free) {
        navigate("/tickets");
        return;
      }

      // * paid events -go to checkout with the real registration ID
      navigate(
        `/checkout?event_id=${event.id}&registration_id=${result.id}&subtotal=${event.price}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setRegError(msg);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <Layout isAuthenticated={isAuthenticated} isOrgContext={isOrgContext}>
      {/* full-bleed hero -pulls into navbar area */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 420,
          marginTop: "-96px",
          background: "linear-gradient(135deg, var(--low), var(--mid))",
        }}
      >
        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,10,38,0.15) 0%, rgba(5,10,38,0.72) 100%)",
          }}
        />

        {/* content */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ padding: "0 32px 40px", maxWidth: 1200, margin: "0 auto" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* back link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-white no-underline mb-5 opacity-70 hover:opacity-100 transition-opacity"
              style={{ fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 600 }}
            >
              ← All events
            </Link>

            {/* category + status pills */}
            <div className="flex items-center gap-2 mb-4">
              <span
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "white",
                }}
              >
                {event.visibility}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: chip.bg,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: chip.color,
                }}
              >
                {event.status}
              </span>
            </div>

            <h1
              className="text-white"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 52px)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                marginBottom: 16,
                maxWidth: "22ch",
              }}
            >
              {event.title}
            </h1>

            <div
              className="flex items-center gap-6 flex-wrap"
              style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}
            >
              <span className="flex items-center gap-2">
                <span className="ms" style={{ fontSize: 16 }}>
                  event
                </span>
                {start.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <span className="ms" style={{ fontSize: 16 }}>
                  location_on
                </span>
                {event.location}
              </span>
              <span className="flex items-center gap-2">
                <span className="ms" style={{ fontSize: 16 }}>
                  group
                </span>
                {event.registered_count.toLocaleString()} / {event.capacity.toLocaleString()}{" "}
                registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* body */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 48,
          alignItems: "start",
        }}
        className="grid-cols-1 lg:grid-cols-[1fr_380px]"
      >
        {/* left -content */}
        <div>
          {/* description */}
          <div style={{ marginBottom: 40 }}>
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: "-0.03em",
                color: "var(--on-bg)",
                marginBottom: 16,
              }}
            >
              About this event
            </h3>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 19,
                lineHeight: 1.65,
                color: "var(--on-var)",
                whiteSpace: "pre-line",
              }}
            >
              {event.description}
            </p>
          </div>

          {/* schedule overview */}
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
              Schedule
            </h4>
            {[
              {
                time: start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                label: "Event starts",
              },
              {
                time: end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                label: "Event ends",
              },
            ].map(({ time, label }) => (
              <div
                key={label}
                className="flex items-center gap-4"
                style={{ padding: "12px 0", borderTop: "1px solid var(--outline)" }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "var(--on-mut)",
                    width: 80,
                    flexShrink: 0,
                  }}
                >
                  {time}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surf)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* organiser actions */}
          {isOrganiser && (
            <>
              <div
                className="flex gap-3 flex-wrap pt-6"
                style={{ borderTop: "1px solid var(--outline)" }}
              >
                <Button variant="secondary" onClick={() => navigate(`/org/events/${event.id}/edit`)}>
                  Edit
                </Button>
                {event.status === "draft" && (
                  <Button
                    loading={publishMutation.isPending}
                    onClick={() => publishMutation.mutate(event.id, { onSuccess: () => navigate(0) })}
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(event.id, { onSuccess: () => navigate("/org/events") })
                  }
                >
                  Delete
                </Button>
              </div>
              <JourneyPanel eventId={event.id} />
            </>
          )}
        </div>

        {/* right -sticky registration rail */}
        <div
          style={{
            position: "sticky",
            top: 96,
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 4px 24px rgba(18,29,63,0.07), 0 12px 48px rgba(18,29,63,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* price */}
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "var(--on-bg)",
              }}
            >
              {priceDisplay}
            </p>
            <p style={{ fontSize: 13, color: "var(--on-mut)", marginTop: 4 }}>per ticket</p>
          </div>

          {/* divider */}
          <div style={{ height: 1, background: "var(--outline)" }} />

          {/* meta rows */}
          {[
            {
              icon: "event",
              label: "Date",
              value: start.toLocaleDateString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric",
              }),
            },
            {
              icon: "schedule",
              label: "Time",
              value: `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
            },
            { icon: "location_on", label: "Location", value: event.location },
            {
              icon: "confirmation_number",
              label: "Capacity",
              value: `${spots > 0 ? spots.toLocaleString() + " spots left" : "Sold out"} of ${event.capacity.toLocaleString()}`,
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex justify-between items-start"
              style={{ fontSize: 13.5 }}
            >
              <span
                className="flex items-center gap-2"
                style={{ color: "var(--on-var)", flexShrink: 0 }}
              >
                <span className="ms" style={{ fontSize: 16, color: "var(--on-mut)" }}>
                  {icon}
                </span>
                {label}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--on-surf)",
                  textAlign: "right",
                  maxWidth: "55%",
                }}
              >
                {value}
              </span>
            </div>
          ))}

          {/* register CTA */}
          {!isOrganiser && (
            <>
              {regError && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--secondary)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {regError}
                </p>
              )}
              <button
                onClick={handleRegister}
                disabled={spots === 0 || registering}
                className="flex items-center justify-center gap-2 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: spots === 0 ? "not-allowed" : "pointer",
                  background:
                    spots > 0 ? "linear-gradient(135deg, #050a26, #121d3f)" : "var(--high)",
                  fontSize: 14.5,
                  fontFamily: "Manrope, sans-serif",
                  color: spots > 0 ? "white" : "var(--on-mut)",
                  width: "100%",
                }}
              >
                <span className="ms" style={{ fontSize: 18 }}>
                  confirmation_number
                </span>
                {spots === 0
                  ? "Sold out"
                  : registering
                    ? "Registering..."
                    : event.is_free
                      ? "Register (Free)"
                      : "Register & Pay"}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
