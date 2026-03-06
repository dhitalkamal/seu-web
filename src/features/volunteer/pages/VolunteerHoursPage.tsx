import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import checkinApi from "@/features/checkin/api/checkin.api";

// * types

/** Shape expected from the shifts endpoint. */
type Shift = {
  id: string;
  event_name?: string;
  role?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
};

/** Status badge colors. */
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  approved: { bg: "#dcfce7", color: "#166534" },
  pending: { bg: "#dbeafe", color: "#1e40af" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

/**
 * Compute hours between two ISO datetime strings.
 * Returns 0 when either value is missing or unparseable.
 *
 * @param start - ISO start datetime string
 * @param end - ISO end datetime string
 * @returns hours as decimal
 */
function computeHours(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.round((ms / 3_600_000) * 10) / 10;
}

// * component

/** Hours log page - track volunteered time with approval status. */
export default function VolunteerHoursPage() {
  // fetch volunteer shifts from the check-in service
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["volunteer-shifts"],
    queryFn: checkinApi.getVolunteerShifts,
  });

  // cast unknown[] from API to local Shift type
  const shifts = raw as Shift[];

  const approvedShifts = shifts.filter((s) => s.status === "approved");
  const pendingShifts = shifts.filter((s) => s.status === "pending");

  const totalHours = approvedShifts.reduce(
    (sum, s) => sum + computeHours(s.start_time, s.end_time),
    0
  );
  const pendingHours = pendingShifts.reduce(
    (sum, s) => sum + computeHours(s.start_time, s.end_time),
    0
  );

  return (
    <AppLayout
      variant="volunteer"
      title="Hours Log"
      subtitle="Track your volunteered hours and approval status."
      crumbs={["Volunteer", "Hours Log"]}
    >
      {/* summary cards */}
      <div className="grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="grid place-items-center"
              style={{ width: 36, height: 36, borderRadius: 9, background: "#dcfce7" }}
            >
              <MS n="check_circle" size={20} style={{ color: "#166534" }} />
            </div>
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--on-var)",
              marginBottom: 4,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            Approved Hours
          </p>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.035em",
              color: "#166534",
              lineHeight: 1,
            }}
          >
            {totalHours > 0 ? `${totalHours}h` : "0h"}
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="grid place-items-center"
              style={{ width: 36, height: 36, borderRadius: 9, background: "#dbeafe" }}
            >
              <MS n="hourglass_top" size={20} style={{ color: "#1e40af" }} />
            </div>
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--on-var)",
              marginBottom: 4,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            Pending Hours
          </p>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.035em",
              color: "#1e40af",
              lineHeight: 1,
            }}
          >
            {pendingHours > 0 ? `${pendingHours}h` : "0h"}
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="grid place-items-center"
              style={{ width: 36, height: 36, borderRadius: 9, background: "#dce1ff" }}
            >
              <MS n="event_available" size={20} style={{ color: "var(--primary)" }} />
            </div>
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--on-var)",
              marginBottom: 4,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            Total Entries
          </p>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.035em",
              color: "var(--primary)",
              lineHeight: 1,
            }}
          >
            {shifts.length}
          </p>
        </div>
      </div>

      {/* loading */}
      {isLoading && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "56px 28px",
            textAlign: "center",
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
            fontSize: 13,
          }}
        >
          Loading shifts...
        </div>
      )}

      {/* hours table or empty state */}
      {!isLoading && shifts.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "56px 28px",
            textAlign: "center",
          }}
        >
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
            timer
          </span>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 8,
            }}
          >
            No hours logged yet
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.55,
              maxWidth: 400,
              margin: "0 auto",
            }}
          >
            Your volunteered hours will appear here once organisers confirm your shift attendance.
          </p>
        </div>
      )}

      {!isLoading && shifts.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--outline)" }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-0.02em",
              }}
            >
              All Shifts
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const st = STATUS_STYLES[s.status ?? "pending"] ?? STATUS_STYLES.pending;
                  const hrs = computeHours(s.start_time, s.end_time);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.event_name ?? "Unknown event"}</td>
                      <td>{s.role ?? "Volunteer"}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {s.start_time
                          ? new Date(s.start_time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "TBD"}
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        {hrs > 0 ? `${hrs}h` : "TBD"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: st.bg,
                            color: st.color,
                            fontFamily: "Manrope, sans-serif",
                            textTransform: "capitalize",
                          }}
                        >
                          {s.status ?? "pending"}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--on-mut)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.notes || "No notes"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
