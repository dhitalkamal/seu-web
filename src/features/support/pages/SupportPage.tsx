import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useOrgStore } from "@/shared/store/org.store";
import supportApi from "../api/support.api";
import type { SupportTicket } from "../api/support.api";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  color: "var(--on-bg)",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Manrope', sans-serif",
  boxSizing: "border-box",
};

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  open: { label: "Open", bg: "#eff6ff", color: "#1e40af" },
  in_progress: { label: "In progress", bg: "#fef9c3", color: "#854d0e" },
  escalated: { label: "Escalated", bg: "#fce7f3", color: "#9d174d" },
  resolved: { label: "Resolved", bg: "#f0fdf4", color: "#166534" },
  closed: { label: "Closed", bg: "var(--low)", color: "var(--on-mut)" },
};

const PRIORITY: Record<string, { label: string; bg: string; color: string }> = {
  critical: { label: "Critical", bg: "#fee2e2", color: "#991b1b" },
  high: { label: "High", bg: "#fef3c7", color: "#92400e" },
  med: { label: "Med", bg: "#ede9fe", color: "#4c1d95" },
  low: { label: "Low", bg: "#f0fdf4", color: "#166534" },
};

export default function SupportPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const org = useOrgStore((s) => s.org);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("med");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: supportApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      supportApi.create({
        subject,
        message,
        priority,
        org_id: org?.id,
        org_name: org?.name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast("Ticket submitted");
      closeModal();
    },
    onError: () => toast("Failed to submit ticket"),
  });

  function closeModal() {
    setShowModal(false);
    setSubject("");
    setMessage("");
    setPriority("med");
  }

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <AppLayout variant={useLocation().pathname.startsWith("/org") ? "org" : "user"}>
      {toastEl}
      <PH
        crumbs={org ? ["Organization", "Support"] : ["Account", "Support"]}
        title="Support"
        sub="Submit tickets and track responses from the platform team."
        actions={
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#050a26",
              color: "white",
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
            }}
          >
            <MS n="add" size={14} />
            New ticket
          </button>
        }
      />

      {/* stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          { icon: "inbox", label: "Open", value: openCount, color: "#1e40af" },
          { icon: "check_circle", label: "Resolved", value: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length, color: "#166534" },
          { icon: "confirmation_number", label: "Total", value: tickets.length, color: "var(--on-bg)" },
        ].map((s) => (
          <div
            key={s.label}
            className="panel"
            style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--low)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <MS n={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: "-0.03em",
                  color: s.color,
                }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* tickets list */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">My tickets</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
            }}
          >
            {tickets.length} total
          </span>
        </div>
        <div className="panel-body flush">
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <MS
                n="support_agent"
                size={32}
                style={{ display: "block", margin: "0 auto 12px", opacity: 0.2 }}
              />
              <p
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                No tickets yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  marginBottom: 16,
                }}
              >
                Have an issue or question? Submit a support ticket and our team will respond.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#050a26",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                }}
              >
                <MS n="add" size={14} />
                Submit your first ticket
              </button>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: SupportTicket) => {
                  const p = PRIORITY[t.priority] ?? PRIORITY.med;
                  const s = STATUS[t.status] ?? STATUS.open;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700 }}>{t.subject}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: p.bg,
                            color: p.color,
                          }}
                        >
                          {p.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: s.bg,
                            color: s.color,
                          }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          color: "var(--on-mut)",
                        }}
                      >
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* create ticket modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(5,10,38,0.06)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <MS n="support_agent" size={18} style={{ color: "var(--on-bg)" }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    New support ticket
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    Describe your issue and we'll get back to you.
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MS n="close" size={16} style={{ color: "var(--on-mut)" }} />
              </button>
            </div>

            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>
                  Subject <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  color: "var(--on-var)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!subject.trim() || createMutation.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: !subject.trim() ? "var(--mid)" : "#050a26",
                  color: !subject.trim() ? "var(--on-mut)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: !subject.trim() ? "not-allowed" : "pointer",
                }}
              >
                <MS n="send" size={14} />
                {createMutation.isPending ? "Submitting..." : "Submit ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
