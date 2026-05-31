import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useEvent, useEventMutations } from "@/features/events/hooks/useEvents";
import eventsApi from "@/features/events/api/events.api";
import apiClient from "@/shared/api/client";

export default function OrgEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const { data: event, isLoading } = useEvent(id ?? "");
  const { publishMutation, deleteMutation } = useEventMutations();

  const { data: tiers = [] } = useQuery({
    queryKey: ["ticket-tiers", id],
    queryFn: async () => {
      const r = await apiClient.get(`/participation/api/v1/events/${id}/ticket-tiers/`);
      return (r.data?.data ?? []) as { id: string; name: string; price: string; capacity: number }[];
    },
    enabled: !!id,
  });

  const { data: media = [] } = useQuery({
    queryKey: ["event-media", id],
    queryFn: () => eventsApi.listMedia(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <AppLayout title="Event"><div className="animate-pulse" style={{ height: 300, borderRadius: 16, background: "var(--low)" }} /></AppLayout>;
  }

  if (!event) {
    return <AppLayout title="Not found"><p style={{ color: "var(--on-mut)" }}>Event not found.</p></AppLayout>;
  }

  const statusPill = event.status === "published" ? "active" : event.status === "draft" ? "draft" : event.status === "cancelled" ? "suspended" : "pending";
  const fillPct = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;

  return (
    <AppLayout>
      {toastEl}
      <PH
        crumbs={["Events", event.title]}
        title={event.title}
        sub={event.location || "No location set"}
        actions={
          <>
            <button className="btn-sm" onClick={() => navigate(`/org/events/${id}/edit`)}>
              <MS n="edit" size={13} /> Edit
            </button>
            {event.status === "draft" && (
              <button className="btn-sm primary" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate(id!, { onSuccess: () => { toast("Event published!"); navigate(0); } })}>
                <MS n="publish" size={13} /> Publish
              </button>
            )}
            <button className="btn-sm" onClick={() => navigate(`/org/events/${id}/analytics`)}>
              <MS n="analytics" size={13} /> Analytics
            </button>
            <button className="btn-sm danger" disabled={deleteMutation.isPending} onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate(id!, { onSuccess: () => navigate("/org/events") }); }}>
              <MS n="delete" size={13} /> Delete
            </button>
          </>
        }
      />

      {/* status + cover */}
      {event.cover_image && (
        <div style={{ height: 200, borderRadius: 16, overflow: "hidden", marginBottom: 20, backgroundImage: `url(${event.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI icon="event" color="lav" label="Status" value={event.status} trend={statusPill} />
        <KPI icon="group" color="pch" label="Registrations" value={`${event.registered_count}/${event.capacity}`} trend={`${fillPct}% filled`} trendKind={fillPct > 85 ? "warn" : "steady"} />
        <KPI icon="confirmation_number" color="mnt" label="Ticket Tiers" value={String(tiers.length || 1)} />
        <KPI icon="photo_library" color="crl" label="Gallery" value={String(media.length)} />
      </div>

      {/* details grid */}
      <div className="chart-grid-2" style={{ marginBottom: 18 }}>
        {/* event info */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Event Details</span></div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DetailRow icon="calendar_today" label="Start" value={new Date(event.start_date).toLocaleString()} />
            <DetailRow icon="event" label="End" value={new Date(event.end_date).toLocaleString()} />
            <DetailRow icon="location_on" label="Location" value={event.location || "-"} />
            <DetailRow icon="visibility" label="Visibility" value={event.visibility} />
            <DetailRow icon="payments" label="Price" value={event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`} />
            {event.is_online && <DetailRow icon="videocam" label="Online" value={event.online_url ?? "Yes"} />}
            {event.allowed_domains && event.allowed_domains.length > 0 && (
              <DetailRow icon="domain" label="Domain Restriction" value={event.allowed_domains.map((d: string) => `@${d}`).join(", ")} />
            )}
          </div>
        </div>

        {/* description */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Description</span></div>
          <div className="panel-body">
            <p style={{ fontSize: 13.5, color: "var(--on-var)", lineHeight: 1.7, fontFamily: "Manrope, sans-serif", whiteSpace: "pre-wrap" }}>{event.description || "No description provided."}</p>
          </div>
        </div>
      </div>

      {/* ticket tiers */}
      {tiers.length > 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head"><span className="panel-title">Ticket Tiers</span><span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "var(--on-mut)" }}>{tiers.length} tiers</span></div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead><tr><th>Tier</th><th>Price</th><th>Capacity</th></tr></thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700 }}>{t.name}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>NPR {parseFloat(t.price).toLocaleString()}</td>
                    <td>{t.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <QuickLink icon="how_to_reg" label="Registrations" onClick={() => navigate(`/org/events/${id}/registrations`)} />
        <QuickLink icon="volunteer_activism" label="Volunteers" onClick={() => navigate(`/org/events/${id}/volunteers`)} />
        <QuickLink icon="analytics" label="Analytics" onClick={() => navigate(`/org/events/${id}/analytics`)} />
        <QuickLink icon="edit" label="Edit Event" onClick={() => navigate(`/org/events/${id}/edit`)} />
      </div>
    </AppLayout>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <MS n={icon} size={16} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif", minWidth: 100 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-bg)", fontFamily: "Manrope, sans-serif" }}>{value}</span>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 14, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--low)", display: "grid", placeItems: "center" }}>
        <MS n={icon} size={20} style={{ color: "var(--primary)" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-bg)", fontFamily: "Manrope, sans-serif" }}>{label}</span>
    </button>
  );
}
