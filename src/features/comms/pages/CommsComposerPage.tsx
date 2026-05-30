import { useState } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";

type Channel = "email" | "in_app" | "push" | "sms";

const CHANNELS: [Channel, string, string][] = [
  ["email", "Email", "mail"],
  ["in_app", "In-app", "notifications"],
  ["push", "Push", "phone_iphone"],
  ["sms", "SMS", "sms"],
];

// coming soon - not yet routed; do not add to App.tsx until the comms backend API is ready
/** Communications composer - send announcements, reminders, or updates to a segment. */
export default function CommsComposerPage() {
  const { toast, toastEl } = useToast();
  const [channels, setChannels] = useState<Channel[]>(["email", "in_app"]);

  /** Toggles a channel on or off. */
  function tog(c: Channel) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Communications", "Composer"]}
        title="Communications composer"
        sub="Send announcements, reminders, or updates to a segment. Choose channels per audience."
        actions={
          <>
            <button className="btn-sm">
              <MS n="history" size={13} />
              Past sends
            </button>
            <button className="btn-sm">
              <MS n="save" size={13} />
              Save as template
            </button>
          </>
        }
      />

      <div className="split">
        {/* compose panel */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Compose</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Draft
            </span>
          </div>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ marginBottom: 0 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  From identity
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    color: "var(--on-bg)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box" as const,
                  }}
                >
                  <option>Select identity</option>
                </select>
              </div>
              <div style={{ marginBottom: 0 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Reply-to
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    color: "var(--on-bg)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box" as const,
                  }}
                  placeholder="reply@example.org"
                />
              </div>
            </div>
            <div style={{ marginBottom: 0 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--on-mut)",
                  marginBottom: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Subject (email) / Title (in-app)
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "var(--low)",
                  color: "var(--on-bg)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: "border-box" as const,
                }}
                placeholder="Enter subject line"
              />
            </div>
            <div style={{ marginBottom: 0 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--on-mut)",
                  marginBottom: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Pre-header (email)
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "var(--low)",
                  color: "var(--on-bg)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: "border-box" as const,
                }}
                placeholder="A short preview line shown in inbox previews."
              />
            </div>
            <div style={{ marginBottom: 0 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--on-mut)",
                  marginBottom: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Message · supports {"{variables}"} and **Markdown**
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "var(--low)",
                  color: "var(--on-bg)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: "border-box" as const,
                }}
                rows={9}
                placeholder="Write your message here..."
              />
            </div>

            {/* channel toggles */}
            <div
              style={{ padding: 14, background: "var(--low)", borderRadius: 10, marginBottom: 14 }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  marginBottom: 8,
                }}
              >
                Channels
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CHANNELS.map(([k, l, ic]) => (
                  <button
                    key={k}
                    onClick={() => tog(k)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: channels.includes(k)
                        ? "1px solid var(--primary)"
                        : "1px solid var(--outline)",
                      background: channels.includes(k) ? "var(--primary)" : "white",
                      color: channels.includes(k) ? "white" : "var(--on-bg)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <MS n={ic} size={13} />
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 10, lineHeight: 1.5 }}>
                Per-user notification preferences are respected. Disabled channels are logged as
                FAILED for that user.
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-sm" onClick={() => toast("Saved as draft")}>
                <MS n="save" size={13} />
                Save draft
              </button>
              <button className="btn-sm" onClick={() => toast("Test sent")}>
                <MS n="send" size={13} />
                Send test
              </button>
              <button className="btn-sm" onClick={() => toast("Scheduled")}>
                <MS n="schedule" size={13} />
                Schedule
              </button>
              <button
                className="btn-sm primary"
                style={{ marginLeft: "auto" }}
                onClick={() => toast("Select an audience first")}
              >
                <MS n="rocket_launch" size={13} />
                Send now
              </button>
            </div>
          </div>
        </div>

        {/* audience + health rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Audience</span>
            </div>
            <div className="panel-body">
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "24px 0",
                }}
              >
                No segments available
              </p>
            </div>
          </div>

          <div className="depth">
            <div className="depth-ic">
              <MS n="campaign" size={112} />
            </div>
            <h4>Send health</h4>
            <p>
              No send history yet. Deliverability metrics will appear after your first campaign.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
