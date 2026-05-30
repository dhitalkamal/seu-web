import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useOrgStore } from "@/shared/store/org.store";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";

type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  amount: string;
  event_ids: string[];
};

const TIERS = [
  { value: "platinum" as const, label: "Platinum", color: "#6366f1" },
  { value: "gold" as const, label: "Gold", color: "#dba13d" },
  { value: "silver" as const, label: "Silver", color: "#9ca3af" },
  { value: "bronze" as const, label: "Bronze", color: "#b45309" },
];

const STORAGE_KEY = "sansaar-sponsors";

function loadSponsors(orgId: string): Sponsor[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return all[orgId] ?? [];
  } catch {
    return [];
  }
}

function saveSponsors(orgId: string, sponsors: Sponsor[]) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  all[orgId] = sponsors;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export default function SponsorsPage() {
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => loadSponsors(orgId));
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", logo_url: "", website: "", tier: "gold" as Sponsor["tier"], amount: "0", event_ids: [] as string[] });

  const { data: myEvents } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
  const events: Event[] = myEvents?.results ?? [];

  function persist(updated: Sponsor[]) {
    setSponsors(updated);
    saveSponsors(orgId, updated);
  }

  function handleSave() {
    if (!form.name.trim()) { toast("Sponsor name is required"); return; }
    if (editId) {
      persist(sponsors.map((s) => s.id === editId ? { ...s, ...form } : s));
      toast("Sponsor updated");
    } else {
      persist([...sponsors, { id: `sp-${Date.now()}`, ...form }]);
      toast("Sponsor added");
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", logo_url: "", website: "", tier: "gold", amount: "0", event_ids: [] });
  }

  function handleEdit(s: Sponsor) {
    setForm({ name: s.name, logo_url: s.logo_url, website: s.website, tier: s.tier, amount: s.amount, event_ids: s.event_ids });
    setEditId(s.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    persist(sponsors.filter((s) => s.id !== id));
    toast("Sponsor removed");
  }

  const activeSponsorCount = sponsors.length;
  const totalCommitted = sponsors.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);
  const uniqueTiers = new Set(sponsors.map((s) => s.tier)).size;
  const eventsSponsored = new Set(sponsors.flatMap((s) => s.event_ids)).size;

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Sponsors"]}
        title="Sponsors and partners"
        sub="Track sponsorship tiers, logo placement, and commitments."
        actions={
          <button className="btn-sm primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", logo_url: "", website: "", tier: "gold", amount: "0", event_ids: [] }); }}>
            <MS n="add" size={13} />
            Add sponsor
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI icon="handshake" color="lav" label="Active sponsors" value={String(activeSponsorCount)} />
        <KPI icon="payments" color="pch" label="Committed (yr)" value={`NPR ${totalCommitted.toLocaleString()}`} />
        <KPI icon="diversity_3" color="mnt" label="Tiers" value={String(uniqueTiers)} />
        <KPI icon="event" color="crl" label="Events sponsored" value={String(eventsSponsored)} />
      </div>

      {/* add/edit form modal */}
      {showForm && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">{editId ? "Edit sponsor" : "New sponsor"}</span>
            <button className="btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sponsor name" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>
                  Tier
                </label>
                <select className="input" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Sponsor["tier"] }))}>
                  {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Logo URL</label>
                <input className="input" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Amount (NPR)</label>
                <input type="number" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Website</label>
              <input className="input" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://sponsor-website.com" />
            </div>
            {events.length > 0 && (
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Link to events</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {events.map((ev) => {
                    const selected = form.event_ids.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, event_ids: selected ? f.event_ids.filter((id) => id !== ev.id) : [...f.event_ids, ev.id] }))}
                        className="btn-sm"
                        style={{ fontSize: 11, padding: "4px 10px", background: selected ? "#050a26" : "white", color: selected ? "white" : "var(--on-bg)", borderColor: selected ? "transparent" : undefined }}
                      >
                        {ev.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-sm primary" onClick={handleSave}>
                {editId ? "Update" : "Add sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* sponsors list */}
      {sponsors.length === 0 && !showForm && (
        <div className="panel">
          <div className="panel-body" style={{ padding: "48px 20px", textAlign: "center" }}>
            <MS n="handshake" size={36} style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }} />
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No sponsors yet</p>
            <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>Add your first sponsor using the button above.</p>
          </div>
        </div>
      )}

      {sponsors.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All sponsors</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "var(--on-mut)" }}>{sponsors.length} total</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Tier</th>
                  <th>Amount</th>
                  <th>Events</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => {
                  const tierInfo = TIERS.find((t) => t.value === s.tier);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--low)", display: "grid", placeItems: "center" }}>
                              <MS n="handshake" size={16} style={{ color: "var(--on-mut)" }} />
                            </div>
                          )}
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</span>
                            {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 11, color: "var(--on-mut)" }}>{s.website}</a>}
                          </div>
                        </div>
                      </td>
                      <td><span className="pill" style={{ background: `${tierInfo?.color}22`, color: tierInfo?.color }}>{tierInfo?.label}</span></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>NPR {parseFloat(s.amount).toLocaleString()}</td>
                      <td style={{ fontSize: 12 }}>{s.event_ids.length} event{s.event_ids.length !== 1 ? "s" : ""}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn-sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(s)}>
                            <MS n="edit" size={13} />
                          </button>
                          <button className="btn-sm danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(s.id)}>
                            <MS n="delete" size={13} />
                          </button>
                        </div>
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
