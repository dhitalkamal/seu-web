import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS, useToast } from "@/shared/components/v8";
import { useEvent } from "@/features/events/hooks/useEvents";
import eventsApi from "@/features/events/api/events.api";
import EventMap from "@/shared/components/EventMap";
import client from "@/shared/api/client";
import type { EventVisibility } from "@/features/events/types/event.types";

type ScheduleItem = { id: string; time: string; title: string; description: string; speaker: string };
type TierForm = { id: string; name: string; price: string; capacity: number; description: string };
type MediaItem = { id: string; url: string; caption: string; position: number };

const lbl = "block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--on-mut)] mb-1.5 font-['JetBrains_Mono']";
const inp = "w-full rounded-[10px] border border-[var(--mid)] bg-[var(--low)] px-3.5 py-2.5 text-sm text-[var(--on-bg)] outline-none font-['Manrope'] placeholder:text-[var(--on-mut)] focus:border-[var(--primary)] transition-colors";

function toLocal(iso: string): string {
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ""; }
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const { data: event, isLoading } = useEvent(id ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState(100);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("0.00");
  const [coverImage, setCoverImage] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [tiers, setTiers] = useState<TierForm[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    setLat(event.latitude ?? null);
    setLng(event.longitude ?? null);
    setStartDate(toLocal(event.start_date));
    setEndDate(toLocal(event.end_date));
    setCapacity(event.capacity);
    setVisibility(event.visibility);
    setIsFree(event.is_free);
    setPrice(event.price ?? "0.00");
    setCoverImage(event.cover_image ?? "");
    setIsOnline(event.is_online ?? false);
    setOnlineUrl(event.online_url ?? "");
  }, [event]);

  const { data: existingTiers } = useQuery({
    queryKey: ["ticket-tiers", id],
    queryFn: async () => {
      const r = await client.get(`/participation/api/v1/events/${id}/ticket-tiers/`);
      return (r.data?.data ?? []) as TierForm[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existingTiers && existingTiers.length > 0 && tiers.length === 0) {
      setTiers(existingTiers.map((t) => ({ ...t, id: t.id ?? `t-${Date.now()}` })));
    }
  }, [existingTiers]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await eventsApi.updateEvent(id, {
        title, description, location,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        capacity, visibility, is_free: isFree,
        price: isFree ? "0.00" : price,
        cover_image: coverImage || null,
        is_online: isOnline,
        online_url: onlineUrl || null,
      });
      for (const tier of tiers) {
        if (!tier.name.trim()) continue;
        try {
          if (tier.id.startsWith("t-")) {
            await client.post(`/participation/api/v1/events/${id}/ticket-tiers/`, { name: tier.name, price: tier.price, capacity: tier.capacity, description: tier.description });
          } else {
            await client.patch(`/participation/api/v1/events/${id}/ticket-tiers/${tier.id}/`, { name: tier.name, price: tier.price, capacity: tier.capacity, description: tier.description });
          }
        } catch { /* non-fatal */ }
      }
      qc.invalidateQueries({ queryKey: ["event", id] });
      toast("Event updated");
      navigate(`/org/events/${id}`);
    } catch {
      toast("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <AppLayout title="Edit event"><div className="animate-pulse" style={{ height: 400, borderRadius: 16, background: "var(--low)" }} /></AppLayout>;
  if (!event) return <AppLayout title="Not found"><p style={{ color: "var(--on-mut)" }}>Event not found.</p></AppLayout>;

  return (
    <AppLayout title="Edit event" subtitle={event.title}>
      {toastEl}
      <div style={{ maxWidth: 760 }}>

        {/* cover image */}
        <Section title="Cover Image">
          {coverImage ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--mid)", height: 200, position: "relative" }}>
              <img src={coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <button type="button" onClick={() => setCoverImage("")} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <MS n="close" size={14} style={{ color: "white" }} />
              </button>
            </div>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 140, borderRadius: 12, border: "2px dashed var(--mid)", cursor: "pointer", background: "var(--low)" }}>
              <MS n="add_photo_alternate" size={28} style={{ color: "var(--on-mut)", marginBottom: 6 }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--on-var)" }}>Upload cover image</p>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { setCoverImage(await eventsApi.uploadCover(f)); } catch {} }} />
            </label>
          )}
        </Section>

        {/* basics */}
        <Section title="Basic Details">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label className={lbl}>Title <span style={{ color: "#ef4444" }}>*</span></label><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={lbl}>Description <span style={{ color: "#ef4444" }}>*</span></label><textarea className={`${inp} min-h-25 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
        </Section>

        {/* schedule & location */}
        <Section title="Schedule & Location">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label className={lbl}>Start <span style={{ color: "#ef4444" }}>*</span></label><input type="datetime-local" className={inp} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><label className={lbl}>End <span style={{ color: "#ef4444" }}>*</span></label><input type="datetime-local" className={inp} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            </div>
            <div><label className={lbl}>Location</label><input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hotel Yak & Yeti, Kathmandu" /></div>

            {!isOnline && (
              <div>
                <label className={lbl}>Pin on map</label>
                <div style={{ height: 240, borderRadius: 12, overflow: "hidden", border: "1px solid var(--mid)" }}>
                  <EventMap latitude={lat ?? 27.7172} longitude={lng ?? 85.324} onClick={(la: number, lo: number) => { setLat(la); setLng(lo); }} />
                </div>
                {lat && <p style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{lat.toFixed(5)}, {lng?.toFixed(5)}</p>}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--low)", borderRadius: 10, border: "1px solid var(--mid)" }}>
              <p style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Online Event</p>
              <button type="button" onClick={() => setIsOnline(!isOnline)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: isOnline ? "#4338ca" : "var(--mid)", cursor: "pointer", position: "relative" }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: "white", position: "absolute", top: 3, left: isOnline ? 23 : 3, transition: "left 200ms" }} />
              </button>
            </div>
            {isOnline && <div><label className={lbl}>Meeting URL</label><input className={inp} value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} placeholder="https://zoom.us/j/..." /></div>}

            {/* agenda */}
            <div>
              <label className={lbl}>Event Agenda</label>
              {schedule.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input type="time" className={inp} value={s.time} onChange={(e) => { const u = [...schedule]; u[i] = { ...u[i], time: e.target.value }; setSchedule(u); }} />
                  <input className={inp} value={s.title} onChange={(e) => { const u = [...schedule]; u[i] = { ...u[i], title: e.target.value }; setSchedule(u); }} placeholder="Session" />
                  <input className={inp} value={s.speaker} onChange={(e) => { const u = [...schedule]; u[i] = { ...u[i], speaker: e.target.value }; setSchedule(u); }} placeholder="Speaker" />
                  <button type="button" onClick={() => setSchedule(schedule.filter((_, j) => j !== i))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--mid)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}><MS n="close" size={14} style={{ color: "var(--on-mut)" }} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setSchedule([...schedule, { id: `s-${Date.now()}`, time: "", title: "", description: "", speaker: "" }])} style={{ padding: "6px 12px", borderRadius: 8, border: "1px dashed var(--mid)", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--on-var)", display: "flex", alignItems: "center", gap: 5 }}><MS n="add" size={14} /> Add session</button>
            </div>
          </div>
        </Section>

        {/* tickets */}
        <Section title="Tickets & Access">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label className={lbl}>Capacity</label><input type="number" min={1} className={inp} value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 1)} /></div>
              <div><label className={lbl}>Visibility</label><select className={inp} value={visibility} onChange={(e) => setVisibility(e.target.value as EventVisibility)}><option value="public">Public</option><option value="private">Private</option><option value="unlisted">Unlisted</option></select></div>
            </div>
            <div>
              <label className={lbl}>Pricing</label>
              <div style={{ display: "flex", gap: 8 }}>
                {([true, false] as const).map((free) => (
                  <button key={String(free)} type="button" onClick={() => setIsFree(free)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: isFree === free ? "2px solid #050a26" : "1px solid var(--mid)", background: isFree === free ? "#050a26" : "var(--surface)", color: isFree === free ? "white" : "var(--on-var)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{free ? "Free" : "Paid"}</button>
                ))}
              </div>
            </div>
            {!isFree && (
              <>
                <div><label className={lbl}>Default Price (NPR)</label><input type="number" min={0} step={0.01} className={inp} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div>
                  <label className={lbl}>Ticket Tiers</label>
                  {tiers.map((t, i) => (
                    <div key={t.id} style={{ padding: 12, background: "var(--low)", borderRadius: 10, border: "1px solid var(--mid)", marginBottom: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px auto", gap: 8 }}>
                        <input className={inp} value={t.name} onChange={(e) => { const u = [...tiers]; u[i] = { ...u[i], name: e.target.value }; setTiers(u); }} placeholder="Tier name" />
                        <input type="number" min={0} className={inp} value={t.price} onChange={(e) => { const u = [...tiers]; u[i] = { ...u[i], price: e.target.value }; setTiers(u); }} placeholder="Price" />
                        <input type="number" min={1} className={inp} value={t.capacity} onChange={(e) => { const u = [...tiers]; u[i] = { ...u[i], capacity: parseInt(e.target.value) || 1 }; setTiers(u); }} placeholder="Qty" />
                        <button type="button" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--mid)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}><MS n="close" size={14} style={{ color: "var(--on-mut)" }} /></button>
                      </div>
                      <input className={inp} value={t.description} onChange={(e) => { const u = [...tiers]; u[i] = { ...u[i], description: e.target.value }; setTiers(u); }} placeholder="Description" style={{ marginTop: 8 }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setTiers([...tiers, { id: `t-${Date.now()}`, name: "", price: "0.00", capacity: 50, description: "" }])} style={{ padding: "6px 12px", borderRadius: 8, border: "1px dashed var(--mid)", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--on-var)", display: "flex", alignItems: "center", gap: 5 }}><MS n="add" size={14} /> Add tier</button>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button onClick={() => navigate(`/org/events/${id}`)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--mid)", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--on-var)" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saving ? "var(--mid)" : "#050a26", color: saving ? "var(--on-mut)" : "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      {/* gallery */}
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><span className="panel-title">Gallery media</span></div>
        <div className="panel-body"><GalleryPanel eventId={id ?? ""} /></div>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--mid)", borderRadius: 16, padding: 28, marginBottom: 18 }}>
      <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

function GalleryPanel({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const { data: media = [] } = useQuery<MediaItem[]>({ queryKey: ["event-media", eventId], queryFn: () => eventsApi.listMedia(eventId), enabled: !!eventId });
  const [uploading, setUploading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try { const url = await eventsApi.uploadCover(file); await eventsApi.addMedia(eventId, { url, position: media.length }); } catch {}
    }
    qc.invalidateQueries({ queryKey: ["event-media", eventId] });
    setUploading(false);
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const reordered = arrayMove(media, media.findIndex((m) => m.id === e.active.id), media.findIndex((m) => m.id === e.over!.id));
    reordered.forEach((m, i) => eventsApi.updateMedia(eventId, m.id, { position: i }));
    qc.setQueryData(["event-media", eventId], reordered);
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
            {media.map((m) => <SortableImg key={m.id} item={m} onDelete={async (mid) => { await eventsApi.deleteMedia(eventId, mid); qc.invalidateQueries({ queryKey: ["event-media", eventId] }); }} />)}
          </SortableContext>
        </DndContext>
      </div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--mid)", cursor: uploading ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, color: "var(--on-var)" }}>
        <MS n="add_photo_alternate" size={15} />{uploading ? "Uploading..." : "Add media"}
        <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
      </label>
    </div>
  );
}

function SortableImg({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, width: 120, height: 90, borderRadius: 8, overflow: "hidden", position: "relative", border: "1px solid var(--mid)", cursor: "grab" }} {...attributes} {...listeners}>
      <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button onClick={() => onDelete(item.id)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><MS n="close" size={12} style={{ color: "white" }} /></button>
    </div>
  );
}
