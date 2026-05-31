import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { useEvent } from "@/features/events/hooks/useEvents";
import checkinApi from "@/features/checkin/api/checkin.api";
import apiClient from "@/shared/api/client";

// registration record returned by the participation service
type Registration = {
  id: string;
  user_id: string;
  event_id: string;
  status: "confirmed" | "cancelled" | "waitlisted" | "checked_in";
  ticket_tier: string | null;
  registered_at: string;
  checked_in_at: string | null;
};

type RegistrationsResponse = {
  data: Registration[];
};

// map each status to a display label and badge variant
const STATUS_META: Record<Registration["status"], { label: string; bg: string; color: string }> = {
  confirmed: { label: "Confirmed", bg: "#d8efe2", color: "#166534" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", color: "#991b1b" },
  waitlisted: { label: "Waitlisted", bg: "#fef9c3", color: "#854d0e" },
  checked_in: { label: "Checked in", bg: "#dce1ff", color: "var(--primary)" },
};

/** Format an ISO date string to a short readable date. Returns "-" when null. */
function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Export the given registrations as a CSV file download. */
function exportCsv(registrations: Registration[], eventTitle: string) {
  const header = ["User ID", "Status", "Ticket Tier", "Registered", "Checked In"];
  const rows = registrations.map((r) => [
    r.user_id,
    r.status,
    r.ticket_tier ?? "",
    fmtDate(r.registered_at),
    fmtDate(r.checked_in_at),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Organizer view of registrations for a specific event - SEU v8 design. */
export default function EventRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(id ?? "");

  // fetch check-in stats for this event from the participation service
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["checkin", "stats", id],
    queryFn: () => checkinApi.getEventStats(id!),
    enabled: !!id,
  });

  // fetch full registrations list from the participation service
  const { data: registrationsData, isLoading: registrationsLoading } = useQuery({
    queryKey: ["registrations", id],
    queryFn: () =>
      apiClient
        .get<RegistrationsResponse>(`/participation/api/v1/events/${id}/registrations/`)
        .then((res) => res.data),
    enabled: !!id,
  });

  const registrations = registrationsData?.data ?? [];

  const filled = event ? Math.round((event.registered_count / event.capacity) * 100) : 0;

  // use checkin stats when available, fall back to event.registered_count
  const totalRegistered = stats?.total ?? event?.registered_count ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const checkinRate = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;

  const spotsLeft = event ? event.capacity - totalRegistered : 0;
  const isLoading = eventLoading || statsLoading;

  return (
    <AppLayout
      title="Registrations"
      subtitle={event?.title}
      actions={
        <Link
          to={`/events/${id}`}
          className="no-underline text-sm font-semibold"
          style={{ color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
        >
          Back to event
        </Link>
      }
    >
      {/* capacity KPIs - 5 tiles when stats available, 3 otherwise */}
      {event && (
        <div
          className="grid mb-6"
          style={{
            gridTemplateColumns: stats ? "repeat(5, 1fr)" : "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {[
            {
              label: "Registered",
              value: isLoading ? "..." : totalRegistered.toLocaleString(),
              icon: "how_to_reg",
              tintBg: "#dce1ff",
              tintColor: "var(--primary)",
            },
            {
              label: "Spots left",
              value: isLoading ? "..." : spotsLeft.toLocaleString(),
              icon: "event_seat",
              tintBg: "#d8efe2",
              tintColor: "var(--success)",
            },
            {
              label: "Fill rate",
              value: isLoading ? "..." : `${filled}%`,
              icon: "donut_large",
              tintBg: "#ffddae",
              tintColor: "#604100",
            },
            ...(stats
              ? [
                  {
                    label: "Checked in",
                    value: checkedIn.toLocaleString(),
                    icon: "verified",
                    tintBg: "#d8efe2",
                    tintColor: "var(--success)",
                  },
                  {
                    label: "Check-in rate",
                    value: `${checkinRate}%`,
                    icon: "qr_code_scanner",
                    tintBg: "#dce1ff",
                    tintColor: "var(--primary)",
                  },
                ]
              : []),
          ].map(({ label, value, icon, tintBg, tintColor }) => (
            <div
              key={label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="grid place-items-center shrink-0"
                  style={{ width: 34, height: 34, borderRadius: 9, background: tintBg }}
                >
                  <span className="ms" style={{ fontSize: 18, color: tintColor }}>
                    {icon}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-var)",
                  marginBottom: 5,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 26,
                  letterSpacing: "-0.035em",
                  color: "var(--primary)",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* fill progress bar */}
      {event && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div className="flex justify-between mb-2">
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--on-bg)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Capacity fill
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--on-mut)",
              }}
            >
              {totalRegistered} / {event.capacity}
            </p>
          </div>
          <div
            style={{ height: 8, background: "var(--low)", borderRadius: 999, overflow: "hidden" }}
          >
            <div
              style={{
                height: "100%",
                width: `${filled}%`,
                background:
                  filled >= 90 ? "var(--secondary)" : "linear-gradient(90deg, #121d3f, #1a2a5e)",
                borderRadius: 999,
                transition: "width 400ms",
              }}
            />
          </div>
          {/* check-in bar when stats are loaded */}
          {stats && (
            <>
              <div className="flex justify-between mt-3 mb-1">
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--on-bg)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  Check-in progress
                </p>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "var(--on-mut)",
                  }}
                >
                  {checkedIn} / {totalRegistered}
                </p>
              </div>
              <div
                style={{
                  height: 8,
                  background: "var(--low)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${checkinRate}%`,
                    background: "linear-gradient(90deg, #166534, #16a34a)",
                    borderRadius: 999,
                    transition: "width 400ms",
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* attendee table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--outline)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* table header row with export button */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--outline)" }}
        >
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--on-bg)",
            }}
          >
            Attendees
            {registrations.length > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "var(--on-mut)",
                  fontWeight: 400,
                }}
              >
                {registrations.length}
              </span>
            )}
          </p>

          {/* export CSV - only shown when there is data */}
          {registrations.length > 0 && (
            <button
              onClick={() => exportCsv(registrations, event?.title ?? "event")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--outline)",
                background: "var(--surface)",
                color: "var(--on-bg)",
                fontFamily: "Manrope, sans-serif",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <span className="ms" style={{ fontSize: 15 }}>
                download
              </span>
              Export CSV
            </button>
          )}
        </div>

        {/* loading state */}
        {registrationsLoading && (
          <div className="py-16 text-center">
            <span
              className="ms"
              style={{ fontSize: 32, color: "var(--high)", display: "block", marginBottom: 10 }}
            >
              hourglass_empty
            </span>
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 13,
                color: "var(--on-mut)",
              }}
            >
              Loading registrations...
            </p>
          </div>
        )}

        {/* empty state */}
        {!registrationsLoading && registrations.length === 0 && (
          <div className="py-16 text-center">
            <span
              className="ms"
              style={{ fontSize: 40, color: "var(--high)", display: "block", marginBottom: 12 }}
            >
              how_to_reg
            </span>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--on-mut)",
              }}
            >
              No registrations yet
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                marginTop: 6,
              }}
            >
              Registrations will appear here once attendees sign up.
            </p>
          </div>
        )}

        {/* registrations table */}
        {!registrationsLoading && registrations.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline)" }}>
                {["User ID", "Status", "Registered", "Checked In"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--on-mut)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, idx) => {
                const meta = STATUS_META[reg.status];
                return (
                  <tr
                    key={reg.id}
                    style={{
                      borderBottom:
                        idx < registrations.length - 1 ? "1px solid var(--outline)" : "none",
                    }}
                  >
                    {/* user id - first 8 chars shown in mono */}
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          color: "var(--on-bg)",
                        }}
                      >
                        {reg.user_id.slice(0, 8)}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          color: "var(--on-mut)",
                        }}
                      >
                        …
                      </span>
                    </td>

                    {/* status pill */}
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: meta.bg,
                          color: meta.color,
                          fontFamily: "Manrope, sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>

                    {/* registered date */}
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          fontFamily: "Manrope, sans-serif",
                          fontSize: 13,
                          color: "var(--on-bg)",
                        }}
                      >
                        {fmtDate(reg.registered_at)}
                      </span>
                    </td>

                    {/* checked-in date or dash */}
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          fontFamily: "Manrope, sans-serif",
                          fontSize: 13,
                          color: reg.checked_in_at ? "var(--on-bg)" : "var(--on-mut)",
                        }}
                      >
                        {fmtDate(reg.checked_in_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
