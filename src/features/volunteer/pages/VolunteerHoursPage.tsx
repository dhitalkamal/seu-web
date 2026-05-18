import { useState } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";

// * ─── Types ──────────────────────────────────────────────────────────────────

/** Single hours log entry — one shift = one entry. */
type HoursEntry = {
  id: string;
  event_name: string;
  role: string;
  date: string;
  hours: number;
  status: "approved" | "pending" | "rejected";
  notes: string;
};

// TODO: wire to volunteer hours API
/** Placeholder — empty until API connected. */
const ENTRIES: HoursEntry[] = [];

/** Status badge styles. */
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  approved: { bg: "#dcfce7", color: "#166534" },
  pending: { bg: "#dbeafe", color: "#1e40af" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

// * ─── Component ──────────────────────────────────────────────────────────────

/** Hours log page — track volunteered time with approval status. */
export default function VolunteerHoursPage() {
  const [entries] = useState<HoursEntry[]>(ENTRIES);

  const totalHours = entries
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.hours, 0);
  const pendingHours = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.hours, 0);

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
            {totalHours > 0 ? totalHours : "—"}
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
            {pendingHours > 0 ? pendingHours : "—"}
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
            {entries.length > 0 ? entries.length : "—"}
          </p>
        </div>
      </div>

      {/* hours table or empty state */}
      {entries.length === 0 ? (
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
      ) : (
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
              All Hours
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
                {entries.map((e) => {
                  const st = STATUS_STYLES[e.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.event_name}</td>
                      <td>{e.role}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {new Date(e.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        {e.hours}h
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
                          {e.status}
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
                        {e.notes || "—"}
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
