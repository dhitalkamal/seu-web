import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useOrgStore } from "@/shared/store/org.store";
import eventsApi from "@/features/events/api/events.api";
import client from "@/shared/api/client";
import type { Event } from "@/features/events/types/event.types";

type Sponsor = {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string;
  website: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  amount: string;
  event_ids: string[];
  created_at: string;
};

const BASE = "/org/api/v1/campaigns/sponsors";

const TIERS = [
  { value: "platinum" as const, label: "Platinum", color: "#6366f1" },
  { value: "gold" as const, label: "Gold", color: "#dba13d" },
  { value: "silver" as const, label: "Silver", color: "#9ca3af" },
  { value: "bronze" as const, label: "Bronze", color: "#b45309" },
];

export default function SponsorsPage() {
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", logo_url: "", website: "", tier: "gold" as Sponsor["tier"], amount: "0", event_ids: [] as string[] });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["sponsors", orgId],
    queryFn: async () => {
      const r = await client.get(`${BASE}/?organization_id=${orgId}`);
      return r.data?.data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: myEvents } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
  const events: Event[] = myEvents?.results ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => client.post(`${BASE}/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsors", orgId] }); toast("Sponsor added"); closeForm(); },
    onError: () => toast("Failed to create sponsor"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => client.patch(`${BASE}/${id}/`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsors", orgId] }); toast("Sponsor updated"); closeForm(); },
    onError: () => toast("Failed to update sponsor"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`${BASE}/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsors", orgId] }); toast("Sponsor removed"); },
    onError: () => toast("Failed to delete sponsor"),
  });

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", logo_url: "", website: "", tier: "gold", amount: "0", event_ids: [] });
  }

  function handleSave() {
    if (!form.name.trim()) { toast("Sponsor name is required"); return; }
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate({ ...form, organization_id: orgId });
    }
  }

  function handleEdit(s: Sponsor) {
    setForm({ name: s.name, logo_url: s.logo_url, website: s.website, tier: s.tier, amount: s.amount, event_ids: s.event_ids });
    setEditId(s.id);
    setShowForm(true);
  }

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
        <KPI icon="handshake" color="lav" label="Active sponsors" value={String(sponsors.length)} />
        <KPI icon="payments" color="pch" label="Committed (yr)" value={`NPR ${totalCommitted.toLocaleString()}`} />
        <KPI icon="diversity_3" color="mnt" label="Tiers" value={String(uniqueTiers)} />
        <KPI icon="event" color="crl" label="Events sponsored" value={String(eventsSponsored)} />
      </div>

      {/* modal form */}
      {showForm && (
        <div onClick={() => closeForm()} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.35)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid var(--outline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="handshake" size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{editId ? "Edit sponsor" : "New sponsor"}</div>
                  <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 1 }}>Add sponsorship details and link to events</div>
                </div>
              </div>
              <button onClick={() => closeForm()} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--mid)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <MS n="close" size={14} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sponsor name" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Tier</label>
                  <select className="input" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Sponsor["tier"] }))}>{TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Logo URL</label><input className="input" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Amount (NPR)</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
              </div>
              <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Website</label><input className="input" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://sponsor-website.com" /></div>
              {events.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-mut)" }}>Link to events</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {events.map((ev) => {
                      const selected = form.event_ids.includes(ev.id);
                      return (<button key={ev.id} type="button" onClick={() => setForm((f) => ({ ...f, event_ids: selected ? f.event_ids.filter((id) => id !== ev.id) : [...f.event_ids, ev.id] }))} className="btn-sm" style={{ fontSize: 11, padding: "4px 10px", background: selected ? "#050a26" : "white", color: selected ? "white" : "var(--on-bg)", borderColor: selected ? "transparent" : undefined }}>{ev.title}</button>);
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6 }}>
                <button className="btn-sm" onClick={() => closeForm()}>Cancel</button>
                <button className="btn-sm primary" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? "Update" : "Add sponsor"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* empty state */}
      {sponsors.length === 0 && !showForm && (
        <div className="panel">
          <div className="panel-body" style={{ padding: "48px 20px", textAlign: "center" }}>
            <MS n="handshake" size={36} style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }} />
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No sponsors yet</p>
            <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>Add your first sponsor using the button above.</p>
          </div>
        </div>
      )}

      {/* sponsors table */}
      {sponsors.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All sponsors</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "var(--on-mut)" }}>{sponsors.length} total</span>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead><tr><th>Sponsor</th><th>Tier</th><th>Amount</th><th>Events</th><th>Actions</th></tr></thead>
              <tbody>
                {sponsors.map((s) => {
                  const tierInfo = TIERS.find((t) => t.value === s.tier);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {s.logo_url ? (<img src={s.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />) : (<div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--low)", display: "grid", placeItems: "center" }}><MS n="handshake" size={16} style={{ color: "var(--on-mut)" }} /></div>)}
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
                          <button className="btn-sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(s)}><MS n="edit" size={13} /></button>
                          <button className="btn-sm danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteMutation.mutate(s.id)}><MS n="delete" size={13} /></button>
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
