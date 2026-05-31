import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import checkinApi from "@/features/checkin/api/checkin.api";

// shape returned by the volunteer shifts endpoint
type Shift = {
  id: string;
  event_id: string;
  role_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  description: string | null;
  created_at: string;
};

/** Visual styles for shift status badges. */
const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  upcoming: { bg: "#dbeafe", color: "#1e40af" },
  completed: { bg: "#dcfce7", color: "#166534" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

/** My volunteer shifts timeline, loaded from the participation service. */
export default function VolunteerShiftsPage() {
  const { data: rawShifts, isLoading } = useQuery({
    queryKey: ["volunteer-shifts"],
    queryFn: checkinApi.getVolunteerShifts,
  });

  // cast the unknown[] to Shift[] after the API call
  const shifts = (rawShifts ?? []) as Shift[];

  return (
    <AppLayout
      variant="volunteer"
      title="My Shifts"
      subtitle="All your upcoming and past volunteer shifts."
      crumbs={["Volunteer", "My Shifts"]}
    >
      {isLoading && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
            Loading shifts...
          </p>
        </div>
      )}

      {!isLoading && shifts.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <span
            className="ms"
            style={{ fontSize: 36, color: "var(--on-mut)", marginBottom: 8, display: "block" }}
          >
            event_busy
          </span>
          <p style={{ fontSize: 14, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
            No shifts yet
          </p>
        </div>
      )}

      {!isLoading && shifts.length > 0 && (
        <div className="panel">
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Location</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const start = new Date(s.starts_at);
                  const end = new Date(s.ends_at);
                  const isPast = end < new Date();
                  const pill = isPast ? STATUS_PILL.completed : STATUS_PILL.upcoming;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                        {start.toLocaleDateString()}{" "}
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>{s.location ?? "-"}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: pill.bg,
                            color: pill.color,
                          }}
                        >
                          {s.capacity} slots
                        </span>
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
