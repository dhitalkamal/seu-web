import { useState } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";

// * ─── Types ──────────────────────────────────────────────────────────────────

/** Certificate issued to a volunteer after completing an event or training. */
type Certificate = {
  id: string;
  title: string;
  event_name: string;
  issued_at: string;
  hours: number;
  type: "event" | "training" | "achievement";
  download_url: string;
};

// TODO: wire to certificates API
/** Placeholder — empty until API connected. */
const CERTS: Certificate[] = [];

/** Badge colors by certificate type. */
const TYPE_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  event: { bg: "#dce1ff", color: "var(--primary)", icon: "event" },
  training: { bg: "#d8efe2", color: "#166534", icon: "school" },
  achievement: { bg: "#ffddae", color: "#604100", icon: "emoji_events" },
};

// * ─── Component ──────────────────────────────────────────────────────────────

/** Certificates page — view and download earned volunteer certificates. */
export default function VolunteerCertificatesPage() {
  const [certs] = useState<Certificate[]>(CERTS);

  return (
    <AppLayout
      variant="volunteer"
      title="Certificates"
      subtitle="Your earned volunteer certificates and achievements."
      crumbs={["Volunteer", "Certificates"]}
    >
      {/* empty state */}
      {certs.length === 0 && (
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
              fontSize: 48,
              color: "var(--on-mut)",
              opacity: 0.3,
              display: "block",
              marginBottom: 14,
            }}
          >
            workspace_premium
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
            No certificates yet
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.55,
              maxWidth: 420,
              margin: "0 auto",
            }}
          >
            Complete volunteer shifts and training modules to earn certificates. They'll appear here
            for you to download and share.
          </p>
        </div>
      )}

      {/* certificate grid */}
      {certs.length > 0 && (
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}
        >
          {certs.map((cert) => {
            const ts = TYPE_STYLES[cert.type] ?? TYPE_STYLES.event;
            return (
              <div
                key={cert.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--outline)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* certificate header banner */}
                <div
                  style={{
                    padding: "20px 20px 16px",
                    background: `linear-gradient(135deg, ${ts.bg}, var(--surface))`,
                    borderBottom: "1px solid var(--outline)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    className="grid place-items-center flex-shrink-0"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <MS n={ts.icon} size={24} style={{ color: ts.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: "-0.02em",
                        color: "var(--on-bg)",
                        lineHeight: 1.25,
                        marginBottom: 3,
                      }}
                    >
                      {cert.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-var)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {cert.event_name}
                    </p>
                  </div>
                </div>

                {/* details */}
                <div style={{ padding: "14px 20px 18px" }}>
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className="flex items-center gap-1"
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      <MS n="calendar_today" size={13} />
                      {new Date(cert.issued_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      <MS n="timer" size={13} />
                      {cert.hours}h logged
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: ts.bg,
                      color: ts.color,
                      fontFamily: "Manrope, sans-serif",
                      textTransform: "capitalize",
                      marginBottom: 14,
                    }}
                  >
                    {cert.type}
                  </span>

                  <div style={{ paddingTop: 12, borderTop: "1px solid var(--outline)" }}>
                    <button
                      style={{
                        width: "100%",
                        padding: "9px 0",
                        borderRadius: 9,
                        border: "1px solid var(--outline)",
                        background: "var(--low)",
                        color: "var(--on-var)",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "Manrope, sans-serif",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <MS n="download" size={15} />
                      Download Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
