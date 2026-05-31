import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS, useToast } from "@/shared/components/v8";
import { useEvent, useEventCategories } from "@/features/events/hooks/useEvents";
import eventsApi from "@/features/events/api/events.api";
import EventMap from "@/shared/components/EventMap";
import apiClient from "@/shared/api/client";
import { useOrgStore } from "@/shared/store/org.store";
import type { EventVisibility } from "@/features/events/types/event.types";

// * --- Local types ------------------------------------------------------------

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string;
};

type TierForm = {
  id: string;
  name: string;
  price: string;
  capacity: number;
  description: string;
};

type VolunteerRole = {
  id?: string;
  name: string;
  description: string;
  capacity: number;
};

type MediaItem = {
  id: string;
  url: string;
  caption: string;
  position: number;
};

// * --- Step definitions -------------------------------------------------------

const STEPS = [
  { icon: "edit_note", label: "Basics" },
  { icon: "calendar_month", label: "Schedule & Location" },
  { icon: "confirmation_number", label: "Tickets & Access" },
  { icon: "photo_library", label: "Media Gallery" },
] as const;

type Step = 0 | 1 | 2 | 3;

// * --- Shared style constants -------------------------------------------------

const lbl =
  "block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--on-mut)] mb-1.5 font-['JetBrains_Mono']";
const inp =
  "w-full rounded-[10px] border border-[var(--mid)] bg-[var(--low)] px-3.5 py-2.5 text-sm text-[var(--on-bg)] outline-none font-['Manrope'] placeholder:text-[var(--on-mut)] focus:border-[var(--primary)] transition-colors";

// convert ISO date string to datetime-local input value
function toLocal(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

// * --- Main component ---------------------------------------------------------

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const org = useOrgStore((s) => s.org);

  const { data: event, isLoading } = useEvent(id ?? "");
  const { data: categoriesResponse } = useEventCategories();
  const categories = categoriesResponse?.data ?? [];

  const [step, setStep] = useState<Step>(0);

  // * step 0 - basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // * step 1 - schedule & location
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  // * step 2 - tickets & access
  const [capacity, setCapacity] = useState(100);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("0.00");
  const [tiers, setTiers] = useState<TierForm[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [volunteersEnabled, setVolunteersEnabled] = useState(false);
  const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
  const [networkingEnabled, setNetworkingEnabled] = useState(false);
  const [autoCommunity, setAutoCommunity] = useState(true);
  const [sponsorIds, setSponsorIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  // seed form from loaded event data
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
    setAllowedDomains(event.allowed_domains ?? []);
    // load category if present on event data
    if (event.category_id) setCategoryId(event.category_id);
    // load networking / community flags if the API returns them
    if ("networking_enabled" in event)
      setNetworkingEnabled(!!(event as { networking_enabled?: boolean }).networking_enabled);
    if ("auto_community" in event)
      setAutoCommunity(!!(event as { auto_community?: boolean }).auto_community);
  }, [event]);

  // load existing ticket tiers
  const { data: existingTiers } = useQuery({
    queryKey: ["ticket-tiers", id],
    queryFn: async () => {
      const r = await apiClient.get(`/participation/api/v1/events/${id}/ticket-tiers/`);
      return (r.data?.data ?? []) as TierForm[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existingTiers && existingTiers.length > 0 && tiers.length === 0) {
      setTiers(existingTiers.map((t) => ({ ...t, id: t.id ?? `t-${Date.now()}` })));
    }
  }, [existingTiers]);

  // load existing volunteer roles for this event
  const { data: existingRoles } = useQuery({
    queryKey: ["volunteer-roles", id],
    queryFn: async () => {
      const r = await apiClient.get(`/org/api/v1/volunteers/roles/?event_id=${id}`);
      return (r.data?.data ?? []) as VolunteerRole[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existingRoles && existingRoles.length > 0 && volunteerRoles.length === 0) {
      setVolunteerRoles(existingRoles);
      setVolunteersEnabled(true);
    }
  }, [existingRoles]);

  // * save handler
  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await eventsApi.updateEvent(id, {
        title,
        description,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        capacity,
        visibility,
        is_free: isFree,
        price: isFree ? "0.00" : price,
        cover_image: coverImage || null,
        is_online: isOnline,
        online_url: onlineUrl || null,
        allowed_domains: allowedDomains,
        // send category_id only when a valid value is selected
        ...(categoryId ? { category_id: categoryId } : {}),
      });

      // persist new ticket tiers / update existing ones
      for (const tier of tiers) {
        if (!tier.name.trim()) continue;
        try {
          if (tier.id.startsWith("t-")) {
            await apiClient.post(`/participation/api/v1/events/${id}/ticket-tiers/`, {
              name: tier.name,
              price: tier.price,
              capacity: tier.capacity,
              description: tier.description,
            });
          } else {
            await apiClient.patch(`/participation/api/v1/events/${id}/ticket-tiers/${tier.id}/`, {
              name: tier.name,
              price: tier.price,
              capacity: tier.capacity,
              description: tier.description,
            });
          }
        } catch {
          // non-fatal - tier errors don't block the whole save
        }
      }

      // create new volunteer roles (only those without a server id)
      if (volunteersEnabled) {
        for (const role of volunteerRoles) {
          if (!role.name.trim() || role.id) continue;
          try {
            await apiClient.post("/org/api/v1/volunteers/roles/", {
              event_id: id,
              organization_id: org?.id,
              name: role.name,
              description: role.description,
              capacity: role.capacity,
            });
          } catch {
            // non-fatal
          }
        }
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

  // domain chip helpers
  function addDomain() {
    const d = domainInput.trim().toLowerCase();
    if (d && !allowedDomains.includes(d)) {
      setAllowedDomains([...allowedDomains, d]);
    }
    setDomainInput("");
  }

  if (isLoading) {
    return (
      <AppLayout title="Edit event">
        <div
          className="animate-pulse"
          style={{ height: 400, borderRadius: 16, background: "var(--low)" }}
        />
      </AppLayout>
    );
  }
  if (!event) {
    return (
      <AppLayout title="Not found">
        <p style={{ color: "var(--on-mut)" }}>Event not found.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit event" subtitle={event.title}>
      {toastEl}
      <div style={{ display: "flex", gap: 24, minHeight: 520 }}>
        {/* wizard sidebar */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            background: "var(--surface)",
            border: "1px solid var(--mid)",
            borderRadius: 16,
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignSelf: "flex-start",
            position: "sticky",
            top: 80,
          }}
        >
          {STEPS.map((s, i) => {
            const active = step === i;
            return (
              <button
                key={i}
                onClick={() => setStep(i as Step)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "#050a26" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: active ? "rgba(255,255,255,0.1)" : "var(--low)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MS
                    n={s.icon}
                    size={16}
                    style={{ color: active ? "#dba13d" : "var(--on-mut)" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "white" : "var(--on-bg)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--mid)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 16,
            }}
          >
            {/* step 0 - basics */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  Event Basics
                </h3>

                {/* cover image */}
                {coverImage ? (
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid var(--mid)",
                      height: 200,
                      position: "relative",
                    }}
                  >
                    <img
                      src={coverImage}
                      alt="Cover"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <MS n="close" size={14} style={{ color: "white" }} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 140,
                      borderRadius: 12,
                      border: "2px dashed var(--mid)",
                      cursor: "pointer",
                      background: "var(--low)",
                    }}
                  >
                    <MS
                      n="add_photo_alternate"
                      size={28}
                      style={{ color: "var(--on-mut)", marginBottom: 6 }}
                    />
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--on-var)" }}>
                      Upload cover image
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          try {
                            setCoverImage(await eventsApi.uploadCover(f));
                          } catch {
                            // upload failure is non-fatal
                          }
                        }
                      }}
                    />
                  </label>
                )}

                <div>
                  <label className={lbl}>
                    Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>
                    Description <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className={`${inp} min-h-25 resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* category selector */}
                <div>
                  <label className={lbl}>Category</label>
                  <select
                    className={inp}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {`${" - ".repeat(cat.depth)}${cat.name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* step 1 - schedule & location */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  Schedule & Location
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className={lbl}>
                      Start <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className={inp}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={lbl}>
                      End <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className={inp}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* online toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "var(--low)",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                  }}
                >
                  <p
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    Online Event
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: isOnline ? "#4338ca" : "var(--mid)",
                      cursor: "pointer",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background 200ms",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        background: "white",
                        position: "absolute",
                        top: 3,
                        left: isOnline ? 23 : 3,
                        transition: "left 200ms",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  </button>
                </div>

                {isOnline && (
                  <div>
                    <label className={lbl}>Meeting URL</label>
                    <input
                      className={inp}
                      value={onlineUrl}
                      onChange={(e) => setOnlineUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                )}

                {/* venue selector */}
                <div>
                  <label className={lbl}>Venue / Location</label>
                  <VenueSelector
                    value={location}
                    orgId={org?.id ?? ""}
                    onChange={(loc, la, lo) => {
                      setLocation(loc);
                      if (la != null) setLat(la);
                      if (lo != null) setLng(lo);
                    }}
                  />
                </div>

                {/* map pin */}
                {!isOnline && (
                  <div>
                    <label className={lbl}>Pin on map</label>
                    <div
                      style={{
                        height: 220,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid var(--mid)",
                      }}
                    >
                      <EventMap
                        latitude={lat ?? 27.7172}
                        longitude={lng ?? 85.324}
                        onClick={(la: number, lo: number) => {
                          setLat(la);
                          setLng(lo);
                        }}
                      />
                    </div>
                    {lat && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--on-mut)",
                          marginTop: 4,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {lat.toFixed(5)}, {lng?.toFixed(5)}
                      </p>
                    )}
                  </div>
                )}

                {/* event agenda */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <label className={lbl} style={{ marginBottom: 0 }}>
                      Event Agenda
                    </label>
                    <button
                      type="button"
                      className="btn-sm primary"
                      style={{ fontSize: 11, padding: "5px 12px" }}
                      onClick={() => {
                        const t = prompt("Session title:");
                        if (!t) return;
                        const time = prompt("Time (HH:MM):", "10:00") ?? "";
                        const sp = prompt("Speaker:") ?? "";
                        setSchedule([
                          ...schedule,
                          { id: `s-${Date.now()}`, time, title: t, description: "", speaker: sp },
                        ]);
                      }}
                    >
                      <MS n="add" size={13} /> Add session
                    </button>
                  </div>
                  {schedule.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                        padding: "12px 0",
                      }}
                    >
                      No agenda items yet.
                    </p>
                  )}
                  {schedule
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((s, i) => (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          gap: 14,
                          padding: "12px 0",
                          borderBottom: i < schedule.length - 1 ? "1px solid var(--mid)" : "none",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--primary)",
                            width: 50,
                          }}
                        >
                          {s.time || "--:--"}
                        </p>
                        <div style={{ width: 2, background: "var(--primary)", borderRadius: 1 }} />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              fontFamily: "'Space Grotesk',sans-serif",
                            }}
                          >
                            {s.title}
                          </p>
                          {s.speaker && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "var(--on-mut)",
                                fontFamily: "Manrope, sans-serif",
                              }}
                            >
                              <MS
                                n="person"
                                size={12}
                                style={{ verticalAlign: "middle", marginRight: 3 }}
                              />
                              {s.speaker}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedule(schedule.filter((_, j) => j !== i))}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: "1px solid var(--mid)",
                            background: "transparent",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <MS n="close" size={12} style={{ color: "var(--on-mut)" }} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* step 2 - tickets & access */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  Tickets & Access
                </h3>

                {/* capacity / visibility */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className={lbl}>Capacity</label>
                    <input
                      type="number"
                      min={1}
                      className={inp}
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Visibility</label>
                    <select
                      className={inp}
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as EventVisibility)}
                    >
                      <option value="public">Public - visible to everyone</option>
                      <option value="private">Private - invite only</option>
                      <option value="unlisted">Unlisted - link only</option>
                    </select>
                  </div>
                </div>

                {/* pricing toggle */}
                <div>
                  <label className={lbl}>Pricing</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {([true, false] as const).map((free) => (
                      <button
                        key={String(free)}
                        type="button"
                        onClick={() => setIsFree(free)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: isFree === free ? "2px solid #050a26" : "1px solid var(--mid)",
                          background: isFree === free ? "#050a26" : "var(--surface)",
                          color: isFree === free ? "white" : "var(--on-var)",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "Manrope, sans-serif",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 120ms",
                        }}
                      >
                        <MS n={free ? "money_off" : "payments"} size={16} />
                        {free ? "Free" : "Paid"}
                      </button>
                    ))}
                  </div>
                </div>

                {!isFree && (
                  <>
                    <div>
                      <label className={lbl}>Default Price (NPR)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={inp}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    {/* ticket tiers */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <label className={lbl} style={{ marginBottom: 0 }}>
                          Ticket Tiers
                        </label>
                        <button
                          type="button"
                          className="btn-sm primary"
                          style={{ fontSize: 11, padding: "5px 12px" }}
                          onClick={() => {
                            const n = prompt("Tier name (e.g. VIP, General, Early Bird):");
                            if (!n?.trim()) return;
                            const p = prompt("Price (NPR):", "0.00") ?? "0.00";
                            const c = parseInt(prompt("Capacity:", "50") ?? "50") || 50;
                            const d = prompt("Description (optional):") ?? "";
                            setTiers([
                              ...tiers,
                              {
                                id: `t-${Date.now()}`,
                                name: n.trim(),
                                price: p,
                                capacity: c,
                                description: d,
                              },
                            ]);
                          }}
                        >
                          <MS n="add" size={13} /> Add tier
                        </button>
                      </div>
                      {tiers.length === 0 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--on-mut)",
                            fontFamily: "Manrope, sans-serif",
                            padding: "12px 0",
                          }}
                        >
                          No tiers added. A single default ticket will be used.
                        </p>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {tiers.map((t, i) => (
                          <div
                            key={t.id}
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--mid)",
                              borderRadius: 14,
                              padding: "16px 18px",
                              position: "relative",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: "1px solid var(--mid)",
                                background: "transparent",
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              <MS n="close" size={11} style={{ color: "var(--on-mut)" }} />
                            </button>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "linear-gradient(135deg,#050a26,#3b3a72)",
                                display: "grid",
                                placeItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <MS n="confirmation_number" size={18} style={{ color: "white" }} />
                            </div>
                            <p
                              style={{
                                fontFamily: "'Space Grotesk',sans-serif",
                                fontWeight: 700,
                                fontSize: 15,
                                letterSpacing: "-0.02em",
                                marginBottom: 4,
                              }}
                            >
                              {t.name || "Untitled"}
                            </p>
                            <p
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 18,
                                fontWeight: 700,
                                color: "var(--primary)",
                                marginBottom: 6,
                              }}
                            >
                              NPR {parseFloat(t.price).toLocaleString()}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                fontSize: 11,
                                color: "var(--on-mut)",
                                fontFamily: "Manrope, sans-serif",
                              }}
                            >
                              <span>
                                <MS
                                  n="group"
                                  size={12}
                                  style={{ verticalAlign: "middle", marginRight: 3 }}
                                />
                                {t.capacity} spots
                              </span>
                            </div>
                            {t.description && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--on-var)",
                                  marginTop: 6,
                                  lineHeight: 1.4,
                                }}
                              >
                                {t.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* volunteer toggle */}
                <div
                  style={{
                    padding: "14px 16px",
                    background: "var(--low)",
                    borderRadius: 12,
                    border: "1px solid var(--mid)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          fontFamily: "Manrope, sans-serif",
                          color: "var(--on-bg)",
                          marginBottom: 2,
                        }}
                      >
                        Enable Volunteering
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--on-mut)",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        Allow people to apply as volunteers for this event
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVolunteersEnabled(!volunteersEnabled)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: "none",
                        background: volunteersEnabled ? "#4338ca" : "var(--mid)",
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                        transition: "background 200ms",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: "white",
                          position: "absolute",
                          top: 3,
                          left: volunteersEnabled ? 23 : 3,
                          transition: "left 200ms",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* volunteer roles - only shown when volunteering is enabled */}
                {volunteersEnabled && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <label className={lbl} style={{ marginBottom: 0 }}>
                        Volunteer Roles
                      </label>
                      <button
                        type="button"
                        className="btn-sm primary"
                        style={{ fontSize: 11, padding: "5px 12px" }}
                        onClick={() => {
                          const name = prompt("Role name (e.g. Stage Crew, Registration Desk):");
                          if (!name?.trim()) return;
                          const desc = prompt("Role description:") ?? "";
                          const cap =
                            parseInt(prompt("Number of volunteer slots:", "5") ?? "5") || 5;
                          setVolunteerRoles([
                            ...volunteerRoles,
                            { name: name.trim(), description: desc, capacity: cap },
                          ]);
                        }}
                      >
                        <MS n="add" size={13} /> Add role
                      </button>
                    </div>
                    {volunteerRoles.length === 0 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--on-mut)",
                          fontFamily: "Manrope, sans-serif",
                          padding: "12px 0",
                        }}
                      >
                        No roles added yet. Add volunteer roles for this event.
                      </p>
                    )}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {volunteerRoles.map((role, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--mid)",
                            borderRadius: 14,
                            padding: "16px 18px",
                            position: "relative",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setVolunteerRoles(volunteerRoles.filter((_, i) => i !== idx))
                            }
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: "1px solid var(--mid)",
                              background: "transparent",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <MS n="close" size={11} style={{ color: "var(--on-mut)" }} />
                          </button>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: "linear-gradient(135deg,#16a34a,#22c55e)",
                              display: "grid",
                              placeItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <MS n="volunteer_activism" size={18} style={{ color: "white" }} />
                          </div>
                          <p
                            style={{
                              fontFamily: "'Space Grotesk',sans-serif",
                              fontWeight: 700,
                              fontSize: 15,
                              letterSpacing: "-0.02em",
                              marginBottom: 4,
                            }}
                          >
                            {role.name || "Untitled"}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              fontSize: 11,
                              color: "var(--on-mut)",
                              fontFamily: "Manrope, sans-serif",
                              marginBottom: 6,
                            }}
                          >
                            <span>
                              <MS
                                n="group"
                                size={12}
                                style={{ verticalAlign: "middle", marginRight: 3 }}
                              />
                              {role.capacity} slots
                            </span>
                          </div>
                          {role.description && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--on-var)",
                                lineHeight: 1.4,
                              }}
                            >
                              {role.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* sponsor selector */}
                <div>
                  <label className={lbl}>Event Sponsors</label>
                  <SponsorSelector
                    orgId={org?.id ?? ""}
                    selected={sponsorIds}
                    onChange={(ids) => setSponsorIds(ids)}
                  />
                </div>

                {/* networking toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "var(--low)",
                    borderRadius: 12,
                    border: "1px solid var(--mid)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: "Manrope, sans-serif",
                        color: "var(--on-bg)",
                        marginBottom: 2,
                      }}
                    >
                      Enable Networking
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      Allow attendees to connect and network with each other
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNetworkingEnabled(!networkingEnabled)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: networkingEnabled ? "#4338ca" : "var(--mid)",
                      cursor: "pointer",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background 200ms",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        background: "white",
                        position: "absolute",
                        top: 3,
                        left: networkingEnabled ? 23 : 3,
                        transition: "left 200ms",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  </button>
                </div>

                {/* auto-community toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "var(--low)",
                    borderRadius: 12,
                    border: "1px solid var(--mid)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: "Manrope, sans-serif",
                        color: "var(--on-bg)",
                        marginBottom: 2,
                      }}
                    >
                      Auto-create Community
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      Automatically create a discussion community for this event
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCommunity(!autoCommunity)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: autoCommunity ? "#4338ca" : "var(--mid)",
                      cursor: "pointer",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background 200ms",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        background: "white",
                        position: "absolute",
                        top: 3,
                        left: autoCommunity ? 23 : 3,
                        transition: "left 200ms",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  </button>
                </div>

                {/* domain restrictions */}
                <div
                  style={{
                    padding: "16px 18px",
                    background: "var(--low)",
                    borderRadius: 14,
                    border: "1px solid var(--mid)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <MS n="domain_verification" size={18} style={{ color: "var(--primary)" }} />
                    <div>
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          fontFamily: "Manrope, sans-serif",
                          color: "var(--on-bg)",
                        }}
                      >
                        Domain Restrictions
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "var(--on-mut)",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        Only users with emails from these domains can see and register. Leave empty
                        for no restriction.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: allowedDomains.length ? 10 : 0,
                    }}
                  >
                    <input
                      className={inp}
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDomain();
                        }
                      }}
                      placeholder="e.g. ku.edu.np"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={addDomain}
                      style={{
                        padding: "0 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "#050a26",
                        color: "white",
                        fontSize: 12.5,
                        fontWeight: 700,
                        fontFamily: "Manrope, sans-serif",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MS n="add" size={14} />
                      Add
                    </button>
                  </div>

                  {allowedDomains.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {allowedDomains.map((d) => (
                        <span
                          key={d}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 7,
                            background: "rgba(99,102,241,0.1)",
                            color: "#4338ca",
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          @{d}
                          <button
                            type="button"
                            onClick={() => setAllowedDomains(allowedDomains.filter((x) => x !== d))}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                            }}
                          >
                            <MS n="close" size={13} style={{ color: "#4338ca" }} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {allowedDomains.length === 0 && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      No restrictions. Open to all.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* step 3 - media gallery */}
            {step === 3 && (
              <div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 14,
                  }}
                >
                  Media Gallery
                </h3>
                <GalleryPanel eventId={id ?? ""} />
              </div>
            )}
          </div>

          {/* nav row */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate(`/org/events/${id}`)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--on-var)",
                }}
              >
                Cancel
              </button>
              {step > 0 && (
                <button
                  onClick={() => setStep((step - 1) as Step)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "var(--on-var)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MS n="arrow_back" size={14} /> Previous
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {step < 3 && (
                <button
                  onClick={() => setStep((step + 1) as Step)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: "#050a26",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Next <MS n="arrow_forward" size={14} />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: saving ? "var(--mid)" : "var(--primary)",
                  color: saving ? "var(--on-mut)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MS n="check" size={14} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// * --- VenueSelector ---------------------------------------------------------

// select existing venue from org or type a custom location string
function VenueSelector({
  value,
  orgId,
  onChange,
}: {
  value: string;
  orgId: string;
  onChange: (loc: string, lat: number | null, lng: number | null) => void;
}) {
  const [mode, setMode] = useState<"select" | "custom">(value ? "custom" : "select");

  const { data: venues = [] } = useQuery({
    queryKey: ["venues-for-event", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const r = await apiClient.get(`/org/api/v1/venues/?organization_id=${orgId}`);
      return (r.data?.data ?? []) as {
        id: string;
        name: string;
        address: string;
        city: string;
        latitude?: number;
        longitude?: number;
      }[];
    },
    enabled: !!orgId,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => setMode("select")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: mode === "select" ? "2px solid #050a26" : "1px solid var(--mid)",
            background: mode === "select" ? "#050a26" : "var(--surface)",
            color: mode === "select" ? "white" : "var(--on-var)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Select venue
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: mode === "custom" ? "2px solid #050a26" : "1px solid var(--mid)",
            background: mode === "custom" ? "#050a26" : "var(--surface)",
            color: mode === "custom" ? "white" : "var(--on-var)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Custom location
        </button>
      </div>
      {mode === "select" ? (
        <select
          className={inp}
          value=""
          onChange={(e) => {
            const found = venues.find((item: { id: string }) => item.id === e.target.value);
            if (found) {
              onChange(
                `${found.name}, ${found.address}, ${found.city}`,
                found.latitude ?? null,
                found.longitude ?? null
              );
            }
          }}
        >
          <option value="">Choose a venue...</option>
          {venues.map((item: { id: string; name: string; city: string }) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.city}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={inp}
          value={value}
          onChange={(e) => onChange(e.target.value, null, null)}
          placeholder="e.g. Hotel Yak & Yeti, Kathmandu"
        />
      )}
    </div>
  );
}

// * --- SponsorSelector -------------------------------------------------------

// toggle-button list of sponsors from the org's campaign sponsors
function SponsorSelector({
  orgId,
  selected,
  onChange,
}: {
  orgId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors-for-event", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const r = await apiClient.get(`/org/api/v1/campaigns/sponsors/?organization_id=${orgId}`);
      return (r.data?.data ?? []) as {
        id: string;
        name: string;
        tier: string;
        logo_url: string;
      }[];
    },
    enabled: !!orgId,
  });

  if (sponsors.length === 0) {
    return (
      <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
        No sponsors created yet. Add sponsors from the Sponsors page first.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sponsors.map((s: { id: string; name: string; tier: string }) => {
        const active = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((x) => x !== s.id) : [...selected, s.id])
            }
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: active ? "2px solid #050a26" : "1px solid var(--mid)",
              background: active ? "#050a26" : "var(--surface)",
              color: active ? "white" : "var(--on-var)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            <MS n="handshake" size={13} />
            {s.name}
            <span style={{ fontSize: 10, opacity: 0.7, textTransform: "capitalize" }}>
              ({s.tier})
            </span>
          </button>
        );
      })}
    </div>
  );
}

// * --- GalleryPanel ----------------------------------------------------------

// drag-and-drop media gallery for the event, backed by eventsApi
function GalleryPanel({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const { data: media = [] } = useQuery<MediaItem[]>({
    queryKey: ["event-media", eventId],
    queryFn: () => eventsApi.listMedia(eventId),
    enabled: !!eventId,
  });
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const url = await eventsApi.uploadCover(file);
        await eventsApi.addMedia(eventId, { url, position: media.length });
      } catch {
        // individual upload failure is non-fatal
      }
    }
    qc.invalidateQueries({ queryKey: ["event-media", eventId] });
    setUploading(false);
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const reordered = arrayMove(
      media,
      media.findIndex((m) => m.id === e.active.id),
      media.findIndex((m) => m.id === e.over!.id)
    );
    reordered.forEach((m, i) => eventsApi.updateMedia(eventId, m.id, { position: i }));
    qc.setQueryData(["event-media", eventId], reordered);
  }

  return (
    <div>
      {media.length === 0 && !uploading && (
        <p
          style={{
            fontSize: 13,
            color: "var(--on-mut)",
            padding: "20px 0",
            textAlign: "center",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          No gallery media yet.
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
            {media.map((m) => (
              <SortableImg
                key={m.id}
                item={m}
                onDelete={async (mid) => {
                  await eventsApi.deleteMedia(eventId, mid);
                  qc.invalidateQueries({ queryKey: ["event-media", eventId] });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px dashed var(--mid)",
          cursor: uploading ? "not-allowed" : "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--on-var)",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        <MS n="add_photo_alternate" size={15} />
        {uploading ? "Uploading..." : "Add media"}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

// * --- SortableImg -----------------------------------------------------------

// single draggable thumbnail card inside the gallery
function SortableImg({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        width: 140,
        height: 100,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        border: "1px solid var(--mid)",
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button
        onClick={() => onDelete(item.id)}
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: 6,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <MS n="close" size={12} style={{ color: "white" }} />
      </button>
    </div>
  );
}
