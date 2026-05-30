import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS } from "@/shared/components/v8";
import participationApi from "@/features/participation/api/participation.api";
import type { PassportEntry } from "@/features/participation/api/participation.api";

/**
 * Formats an ISO date string to "Mon DD, YYYY".
 * @param dateStr - ISO date string.
 * @returns human-readable date.
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Role pill colors. */
const ROLE_CLASS: Record<string, string> = {
  attendee: "active",
  volunteer: "lav",
};

/** Status descriptions shown on the timeline. */
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Registered",
  checked_in: "Attended",
};

/**
 * Single timeline entry card.
 * @param entry - passport entry.
 * @param isLast - whether this is the last entry in the list.
 */
function TimelineEntry({ entry, isLast }: { entry: PassportEntry; isLast: boolean }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", gap: 16, position: "relative" }}>
      {/* * vertical line */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 32,
            bottom: -20,
            width: 2,
            background: "var(--mid)",
          }}
        />
      )}

      {/* * dot */}
      <div
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: entry.role === "volunteer" ? "#050a26" : "var(--secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 4,
          zIndex: 1,
        }}
      >
        <MS
          n={entry.role === "volunteer" ? "volunteer_activism" : "event_available"}
          size={16}
          style={{ color: "#fff" }}
        />
      </div>

      {/* * card */}
      <div
        style={{
          flex: 1,
          marginBottom: 20,
          padding: "14px 18px",
          border: "1px solid var(--outline)",
          borderRadius: 10,
          background: "var(--surface)",
          cursor: "pointer",
        }}
        onClick={() => navigate(`/events/${entry.event_id}`)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "Space Grotesk, sans-serif",
              color: "var(--on-bg)",
            }}
          >
            {entry.event_name}
          </span>
          <span className={`pill ${ROLE_CLASS[entry.role] ?? "muted"}`} style={{ fontSize: 10 }}>
            {entry.role}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
              color: "var(--on-mut)",
            }}
          >
            {fmtDate(entry.attended_at)}
          </span>
          <span
            className={`pill ${entry.status === "checked_in" ? "active" : "draft"}`}
            style={{ fontSize: 10 }}
          >
            {STATUS_LABEL[entry.status] ?? entry.status}
          </span>
          {entry.certificate_issued && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MS n="verified" size={13} style={{ color: "#16a34a" }} />
              <span style={{ fontSize: 11, color: "#16a34a", fontFamily: "Manrope, sans-serif" }}>
                Certificate issued
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Verified Event Passport: timeline view of all attended and volunteered events. */
export default function PassportPage() {
  const {
    data: passport,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["passport"],
    queryFn: participationApi.getPassport,
  });

  const attendedCount = (passport?.entries ?? []).filter((e) => e.role === "attendee").length;
  const volunteeredCount = (passport?.entries ?? []).filter((e) => e.role === "volunteer").length;
  const certCount = (passport?.entries ?? []).filter((e) => e.certificate_issued).length;

  // * newest-first sort
  const sorted = [...(passport?.entries ?? [])].sort(
    (a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()
  );

  return (
    <AppLayout variant="user">
      <PH
        crumbs={["Profile", "Event Passport"]}
        title="Verified Event Passport"
        sub="Your signed participation history. Each entry is HMAC-verified."
      />

      <div className="kpi-grid">
        <KPI
          icon="event_available"
          color="lav"
          label="Events attended"
          value={isLoading ? "…" : String(attendedCount)}
        />
        <KPI
          icon="volunteer_activism"
          color="mnt"
          label="Events volunteered"
          value={isLoading ? "…" : String(volunteeredCount)}
        />
        <KPI
          icon="verified"
          color="crl"
          label="Certificates issued"
          value={isLoading ? "…" : String(certCount)}
        />
        <KPI
          icon="fingerprint"
          color="pch"
          label="Total entries"
          value={isLoading ? "…" : String(passport?.entry_count ?? 0)}
        />
      </div>

      {/* * signature panel */}
      {passport && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">Passport signature</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MS n="verified_user" size={13} />
              HMAC-SHA256 verified
            </span>
          </div>
          <div className="panel-body">
            <code
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--on-mut)",
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {passport.signature}
            </code>
            <div
              style={{
                fontSize: 11,
                color: "var(--on-mut)",
                marginTop: 8,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Generated {fmtDate(passport.generated_at)}
            </div>
          </div>
        </div>
      )}

      {/* * loading state */}
      {isLoading && (
        <div className="panel" style={{ padding: 48, textAlign: "center", color: "var(--on-mut)" }}>
          Loading passport...
        </div>
      )}

      {/* * error state */}
      {isError && (
        <div className="panel" style={{ padding: 48, textAlign: "center", color: "var(--error)" }}>
          Failed to load passport. Please try again.
        </div>
      )}

      {/* * empty state */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <MS
            n="travel_explore"
            size={36}
            style={{ opacity: 0.2, display: "block", margin: "0 auto 12px" }}
          />
          <div style={{ fontWeight: 600, fontSize: 16, fontFamily: "Space Grotesk" }}>
            No entries yet
          </div>
          <div style={{ color: "var(--on-mut)", fontSize: 13, marginTop: 4 }}>
            Attend or volunteer at events to build your passport.
          </div>
        </div>
      )}

      {/* * timeline */}
      {sorted.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Participation timeline</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="panel-body" style={{ paddingTop: 20 }}>
            {sorted.map((entry, i) => (
              <TimelineEntry
                key={`${entry.event_id}-${entry.attended_at}`}
                entry={entry}
                isLast={i === sorted.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
