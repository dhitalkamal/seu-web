import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import campaignsApi from "../api/campaigns.api";

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--on-mut)",
  sent: "var(--success, #22c55e)",
  scheduled: "var(--warn, #f59e0b)",
  failed: "var(--danger, #ef4444)",
};

/** Marketing campaigns page - create, manage, and send campaigns. */
export default function CampaignsPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignsApi.list,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["campaign-segments"],
    queryFn: campaignsApi.listSegments,
  });

  /** Create a new campaign and refresh the list. */
  const createMutation = useMutation({
    mutationFn: () => campaignsApi.create({ name, subject, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast("Campaign created");
      setShowModal(false);
      setName("");
      setSubject("");
      setBody("");
    },
  });

  /** Send a campaign immediately. */
  const sendMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.send(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast("Campaign sent");
    },
  });

  const activeCampaign = campaigns.find((c) => c.id === selected);
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count ?? 0), 0);
  const sentCount = campaigns.filter((c) => c.status === "sent").length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Marketing", "Campaigns"]}
        title="Campaigns"
        sub="Create and send targeted email and in-app campaigns to your audience."
        actions={
          <button className="btn-sm primary" onClick={() => setShowModal(true)}>
            <MS n="add" size={13} />
            New campaign
          </button>
        }
      />

      {/* kpi row */}
      <div className="kpi-grid">
        <KPI
          icon="campaign"
          color="lav"
          label="Total campaigns"
          value={campaigns.length.toString()}
        />
        <KPI icon="check_circle" color="mnt" label="Sent" value={sentCount.toString()} />
        <KPI icon="drafts" color="pch" label="Drafts" value={draftCount.toString()} />
        <KPI icon="send" color="nav" label="Total sent" value={totalSent.toLocaleString()} />
      </div>

      {/* create campaign modal */}
      {showModal && (
        <div
          onClick={() => {
            setShowModal(false);
            setName("");
            setSubject("");
            setBody("");
          }}
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
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }}
          >
            {/* modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="campaign" size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>New campaign</div>
                  <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 1 }}>
                    Create a new email or in-app campaign
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setName("");
                  setSubject("");
                  setBody("");
                }}
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
                <MS n="close" size={14} />
              </button>
            </div>

            {/* modal body */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* name field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Spring launch"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* subject field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Subject <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* body field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Body <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Campaign message..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* modal footer */}
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
                onClick={() => {
                  setShowModal(false);
                  setName("");
                  setSubject("");
                  setBody("");
                }}
                style={{
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!name || !subject || !body || createMutation.isPending}
                style={{
                  background:
                    !name || !subject || !body || createMutation.isPending
                      ? "var(--mid)"
                      : "#050a26",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor:
                    !name || !subject || !body || createMutation.isPending
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "'Manrope', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MS n="add" size={13} />
                {createMutation.isPending ? "Creating..." : "Create campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* main grid */}
      <div className="chart-grid-21">
        {/* campaign list */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All campaigns</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
                Loading...
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
                No campaigns yet.
              </div>
            ) : (
              campaigns.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    padding: "14px 20px",
                    borderBottom: i < campaigns.length - 1 ? "1px solid var(--outline)" : undefined,
                    cursor: "pointer",
                    background: selected === c.id ? "var(--low)" : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 2 }}>
                        {c.sent_count.toLocaleString()} sent
                      </div>
                    </div>
                    {/* status badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: STATUS_COLORS[c.status] ?? "var(--on-mut)",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* detail / action rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* campaign detail */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">
                {activeCampaign ? activeCampaign.name : "Select a campaign"}
              </span>
            </div>
            {!selected ? (
              <div
                className="panel-body"
                style={{ textAlign: "center", color: "var(--on-mut)", padding: "40px 0" }}
              >
                Click a campaign to manage it.
              </div>
            ) : (
              <div
                className="panel-body"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {activeCampaign && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--on-mut)" }}>
                      Status:{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          color: STATUS_COLORS[activeCampaign.status] ?? "var(--on-mut)",
                        }}
                      >
                        {activeCampaign.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--on-mut)" }}>
                      Sent: {activeCampaign.sent_count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--on-mut)" }}>
                      Created: {new Date(activeCampaign.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <button
                  className="btn-sm primary"
                  onClick={() => sendMutation.mutate(selected)}
                  disabled={sendMutation.isPending || activeCampaign?.status === "sent"}
                  style={{ justifyContent: "center" }}
                >
                  <MS n="send" size={13} />
                  {activeCampaign?.status === "sent" ? "Already sent" : "Send now"}
                </button>
              </div>
            )}
          </div>

          {/* segments panel */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Segments</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {segments.length === 0 ? (
                <div style={{ padding: "24px 20px", fontSize: 13, color: "var(--on-mut)" }}>
                  No segments yet.
                </div>
              ) : (
                segments.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "12px 20px",
                      borderBottom:
                        i < segments.length - 1 ? "1px solid var(--outline)" : undefined,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 2 }}>
                      {s.member_count.toLocaleString()} members
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
