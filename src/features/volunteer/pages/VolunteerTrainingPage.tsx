import AppLayout from "@/shared/layouts/AppLayout";

const MODULES = [
  {
    title: "Volunteer Orientation",
    desc: "Platform overview, code of conduct, and communication protocols.",
    duration: "15 min",
    done: true,
  },
  {
    title: "Registration Desk Procedures",
    desc: "QR scanning, manual check-in, and handling exceptions.",
    duration: "20 min",
    done: true,
  },
  {
    title: "Emergency Protocols",
    desc: "Evacuation procedures, first-aid contacts, and incident reporting.",
    duration: "10 min",
    done: false,
  },
  {
    title: "Guest Relations",
    desc: "Welcoming guests, handling queries, and escalation paths.",
    duration: "12 min",
    done: false,
  },
  {
    title: "AV & Technical Support",
    desc: "Basic sound and projector setup, troubleshooting guide.",
    duration: "18 min",
    done: false,
  },
];

const DOCS = [
  { title: "Day-of Brief - Quantum Computing Summit", type: "PDF", size: "340 KB" },
  { title: "Venue Map - East Atrium", type: "PDF", size: "1.2 MB" },
  { title: "Contact Sheet", type: "PDF", size: "48 KB" },
];

/** Volunteer training modules and reference documents. */
export default function VolunteerTrainingPage() {
  const done = MODULES.filter((m) => m.done).length;
  const pct = Math.round((done / MODULES.length) * 100);

  return (
    <AppLayout
      variant="volunteer"
      title="Training"
      subtitle="Complete your pre-event training modules."
      crumbs={["Volunteer", "Training"]}
    >
      {/* progress bar */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--outline)",
          borderRadius: 14,
          padding: 22,
          marginBottom: 24,
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--on-bg)",
            }}
          >
            Training progress
          </p>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "var(--on-mut)",
            }}
          >
            {done} / {MODULES.length} modules
          </p>
        </div>
        <div style={{ height: 8, background: "var(--low)", borderRadius: 999 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              borderRadius: 999,
              transition: "width 600ms",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
            marginTop: 6,
          }}
        >
          {pct}% complete
        </p>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* modules */}
        <div className="flex flex-col gap-3">
          {MODULES.map((m, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: m.done ? "1px solid #bbf7d0" : "1px solid var(--outline)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                className="grid place-items-center flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: m.done ? "#dcfce7" : "var(--low)",
                }}
              >
                <span
                  className="ms"
                  style={{ fontSize: 22, color: m.done ? "#166534" : "var(--on-mut)" }}
                >
                  {m.done ? "check_circle" : "radio_button_unchecked"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "Manrope, sans-serif",
                    color: "var(--on-bg)",
                    marginBottom: 3,
                  }}
                >
                  {m.title}
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  {m.desc}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--on-mut)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {m.duration}
                </span>
                {!m.done && (
                  <button
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #050a26, #121d3f)",
                      color: "white",
                      border: "none",
                      fontFamily: "Manrope, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* reference docs */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            overflow: "hidden",
            height: "fit-content",
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
              Reference docs
            </p>
          </div>
          <div className="flex flex-col">
            {DOCS.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: "12px 20px",
                  borderTop: i > 0 ? "1px solid var(--outline)" : "none",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="ms"
                    style={{ fontSize: 22, color: "var(--secondary)", flexShrink: 0 }}
                  >
                    picture_as_pdf
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "Manrope, sans-serif",
                        color: "var(--on-bg)",
                      }}
                    >
                      {d.title}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 1,
                      }}
                    >
                      {d.size}
                    </p>
                  </div>
                </div>
                <span className="ms" style={{ fontSize: 18, color: "var(--on-mut)" }}>
                  download
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
