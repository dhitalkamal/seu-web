import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import type { Event } from "@/features/events/types/event.types";
import taxonomyApi from "@/features/taxonomy/api/taxonomy.api";
import type { EventCategory } from "@/features/taxonomy/api/taxonomy.api";
import registrationApi from "@/features/registration/api/registration.api";
import type { SavedEvent } from "@/features/registration/api/registration.api";

/**
 * Calculates the capacity-fill percentage for a given event.
 * @param ev - the event to check
 * @returns fill percentage 0-100
 */
function fillPercent(ev: Event): number {
  if (ev.capacity <= 0) return 0;
  return (ev.registered_count / ev.capacity) * 100;
}

/**
 * Formats a date string into a short display label, e.g. "OCT 12".
 * @param iso - ISO date string
 * @returns uppercase short date
 */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${d.getDate()}`;
}

/**
 * Approximate great-circle distance between two points using the Haversine formula.
 * @param lat1 - origin latitude in decimal degrees
 * @param lng1 - origin longitude in decimal degrees
 * @param lat2 - destination latitude in decimal degrees
 * @param lng2 - destination longitude in decimal degrees
 * @returns distance in kilometres
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Discover events - live data, featured hero, category filter, event grid, calendar view. */
export default function EventListPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  // * toggle between card grid and FullCalendar view
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  // * category filter uses real category IDs from the API
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // * client-side filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterFree, setFilterFree] = useState<boolean | undefined>(undefined);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // * search term populated from URL params (issue 30)
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");

  // * location radius filter state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [sortByDistance, setSortByDistance] = useState(false);

  // * saved events state - backed by real API, keyed by event_id -> saved record
  const { data: savedRecords = [] } = useQuery<SavedEvent[]>({
    queryKey: ["saved-events"],
    queryFn: () => registrationApi.listSavedEvents(),
    staleTime: 30 * 1000,
  });
  const savedByEventId = new Map<string, SavedEvent>(savedRecords.map((r) => [r.event_id, r]));

  const saveMutation = useMutation({
    mutationFn: (eventId: string) => registrationApi.saveEvent(eventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-events"] }),
    onError: () => toast("Could not save event"),
  });

  const unsaveMutation = useMutation({
    mutationFn: (savedEventId: string) => registrationApi.unsaveEvent(savedEventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-events"] }),
    onError: () => toast("Could not unsave event"),
  });

  // * sync search from URL on mount
  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearchTerm(s);
  }, [searchParams]);

  // * close filter panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // * fetch real categories from the API (issue 35)
  const { data: categories } = useQuery<EventCategory[]>({
    queryKey: ["categories"],
    queryFn: () => taxonomyApi.listCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // * build filter object for the events query
  const apiFilters = {
    ...(selectedCategoryId !== "all" ? { category: selectedCategoryId } : {}),
    ...(filterFree !== undefined ? { is_free: filterFree } : {}),
    ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
    // include geo params only when we have the user's location
    ...(userLocation ? { lat: userLocation.lat, lng: userLocation.lng, radius_km: radiusKm } : {}),
  };

  const { data, isLoading } = usePublicEvents(
    Object.keys(apiFilters).length ? apiFilters : undefined
  );
  let events = data?.results ?? [];

  // * client-side date range filter (API may not support it; apply after fetch)
  if (filterDateFrom) {
    const from = new Date(filterDateFrom).getTime();
    events = events.filter((ev) => new Date(ev.start_date).getTime() >= from);
  }
  if (filterDateTo) {
    const to = new Date(filterDateTo).getTime();
    events = events.filter((ev) => new Date(ev.start_date).getTime() <= to);
  }

  // * sort by distance (haversine) when the user has enabled it and shared location
  if (sortByDistance && userLocation) {
    events = [...events].sort((a, b) => {
      const distA = haversineKm(
        userLocation.lat,
        userLocation.lng,
        a.latitude ?? 0,
        a.longitude ?? 0
      );
      const distB = haversineKm(
        userLocation.lat,
        userLocation.lng,
        b.latitude ?? 0,
        b.longitude ?? 0
      );
      return distA - distB;
    });
  }

  const featured = events.length > 0 ? events[0] : null;

  /**
   * Toggle save for an event via the backend API.
   * @param eventId - the event to save or unsave.
   * @param e - mouse event, stopped from propagation.
   */
  function toggleSave(eventId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const existing = savedByEventId.get(eventId);
    if (existing) {
      unsaveMutation.mutate(existing.id, {
        onSuccess: () => toast("Removed from saved events"),
      });
    } else {
      saveMutation.mutate(eventId, {
        onSuccess: () => toast("Event saved"),
      });
    }
  }

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Discover"]}
        title="Discover programmes"
        sub="Browse upcoming events across the platform."
        actions={
          <>
            {/* filter button with dropdown panel (issue 19) */}
            <div style={{ position: "relative" }} ref={filterRef}>
              <button
                className={`btn-sm${filterOpen ? " primary" : ""}`}
                onClick={() => setFilterOpen((o) => !o)}
              >
                <MS n="filter_alt" size={13} />
                Filter
                {(filterFree !== undefined || filterDateFrom || filterDateTo) && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#e83151",
                      display: "inline-block",
                      marginLeft: 2,
                    }}
                  />
                )}
              </button>

              {filterOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    zIndex: 50,
                    background: "var(--surface)",
                    border: "1px solid var(--outline)",
                    borderRadius: 12,
                    padding: 16,
                    width: 260,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* price filter */}
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--on-mut)",
                        fontFamily: "JetBrains Mono, monospace",
                        marginBottom: 8,
                      }}
                    >
                      Price
                    </p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(
                        [
                          { label: "All", value: undefined },
                          { label: "Free", value: true },
                          { label: "Paid", value: false },
                        ] as { label: string; value: boolean | undefined }[]
                      ).map(({ label, value }) => (
                        <button
                          key={label}
                          onClick={() => setFilterFree(value)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 7,
                            border: filterFree === value ? "none" : "1px solid var(--mid)",
                            background: filterFree === value ? "#050a26" : "transparent",
                            color: filterFree === value ? "white" : "var(--on-var)",
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "Manrope, sans-serif",
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* date range */}
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--on-mut)",
                        fontFamily: "JetBrains Mono, monospace",
                        marginBottom: 8,
                      }}
                    >
                      Date range
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--mid)",
                          background: "var(--low)",
                          fontSize: 12,
                          color: "var(--on-bg)",
                          fontFamily: "Manrope, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--mid)",
                          background: "var(--low)",
                          fontSize: 12,
                          color: "var(--on-bg)",
                          fontFamily: "Manrope, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* clear button */}
                  <button
                    onClick={() => {
                      setFilterFree(undefined);
                      setFilterDateFrom("");
                      setFilterDateTo("");
                      setFilterOpen(false);
                    }}
                    style={{
                      padding: "6px 0",
                      borderRadius: 7,
                      border: "1px solid var(--mid)",
                      background: "transparent",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* location radius search */}
            {userLocation ? (
              // when location is active: show radius picker, sort toggle, and clear
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="btn-sm"
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                    background: "var(--surface)",
                    border: "1px solid var(--mid)",
                    color: "var(--on-bg)",
                    borderRadius: 7,
                    padding: "5px 8px",
                  }}
                >
                  {[5, 10, 25, 50].map((km) => (
                    <option key={km} value={km}>
                      {km} km
                    </option>
                  ))}
                </select>
                <button
                  className={`btn-sm${sortByDistance ? " primary" : ""}`}
                  onClick={() => setSortByDistance((s) => !s)}
                  title="Sort by distance from your location"
                >
                  <MS n="near_me" size={13} />
                  {sortByDistance ? "Sorted" : "Sort by distance"}
                </button>
                <button
                  className="btn-sm"
                  onClick={() => {
                    setUserLocation(null);
                    setSortByDistance(false);
                    setLocationError("");
                  }}
                  title="Clear location filter"
                >
                  <MS n="location_off" size={13} />
                  Clear
                </button>
              </div>
            ) : (
              // no location yet: show the "Near me" button
              <button
                className="btn-sm"
                disabled={locating}
                onClick={() => {
                  setLocating(true);
                  setLocationError("");
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setLocating(false);
                    },
                    (err) => {
                      setLocationError(err.message);
                      setLocating(false);
                    }
                  );
                }}
              >
                <MS n="my_location" size={13} />
                {locating ? "Locating…" : "Near me"}
              </button>
            )}

            {/* calendar / grid toggle */}
            <button
              className={`btn-sm${viewMode === "calendar" ? " primary" : ""}`}
              onClick={() => setViewMode((m) => (m === "grid" ? "calendar" : "grid"))}
            >
              <MS n={viewMode === "calendar" ? "grid_view" : "event"} size={13} />
              {viewMode === "calendar" ? "Grid view" : "Calendar view"}
            </button>
          </>
        }
      />

      {/* geolocation error - shown below the header bar */}
      {locationError && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 14px",
            background: "rgba(232,49,81,0.08)",
            borderRadius: 10,
            border: "1px solid rgba(232,49,81,0.2)",
            fontSize: 13,
            color: "var(--secondary)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Location error: {locationError}
        </div>
      )}

      {/* search bar - populated from URL params (issue 30) */}
      {searchTerm && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: "8px 14px",
            background: "var(--low)",
            borderRadius: 10,
            border: "1px solid var(--outline)",
          }}
        >
          <MS n="search" size={14} style={{ color: "var(--on-mut)" }} />
          <span
            style={{
              fontSize: 13,
              fontFamily: "Manrope, sans-serif",
              flex: 1,
              color: "var(--on-bg)",
            }}
          >
            Showing results for: <strong>{searchTerm}</strong>
          </span>
          <button
            onClick={() => setSearchTerm("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "grid",
              placeItems: "center",
            }}
          >
            <MS n="close" size={14} style={{ color: "var(--on-mut)" }} />
          </button>
        </div>
      )}

      {/* category chips - real IDs from API (issue 35) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className={`aud-chip${selectedCategoryId === "all" ? " on" : ""}`}
          onClick={() => setSelectedCategoryId("all")}
          style={{ margin: 0 }}
        >
          All
        </button>
        {(categories ?? []).map((cat) => (
          <button
            key={cat.id}
            className={`aud-chip${selectedCategoryId === cat.id ? " on" : ""}`}
            onClick={() => setSelectedCategoryId(cat.id)}
            style={{ margin: 0 }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* featured hero */}
      {isLoading ? (
        <div
          className="animate-pulse"
          style={{ height: 240, borderRadius: 16, marginBottom: 24, background: "var(--surface)" }}
        />
      ) : featured ? (
        <div
          style={{
            background: "linear-gradient(135deg,#050a26,#121d3f)",
            borderRadius: 16,
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            minHeight: 240,
            cursor: "pointer",
          }}
          onClick={() => navigate(`/events/${featured.id}`)}
        >
          <div
            style={{
              padding: "32px 36px",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--tertiary)",
                marginBottom: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 1,
                  background: "var(--tertiary)",
                  display: "inline-block",
                }}
              />
              Featured this week
            </span>
            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 500,
                fontSize: 34,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                marginBottom: 12,
              }}
            >
              {featured.title}
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 18,
                maxWidth: "48ch",
                lineHeight: 1.55,
              }}
            >
              {featured.location} &middot; {shortDate(featured.start_date)}.{" "}
              {featured.registered_count.toLocaleString()} attending.{" "}
              {(featured.capacity - featured.registered_count).toLocaleString()} spots left.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-sm primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${featured.id}`);
                }}
              >
                {featured.is_free
                  ? "Register · Free"
                  : `Register · NPR ${parseFloat(featured.price).toLocaleString()}`}
              </button>
              {/* save to localStorage (issue 20) */}
              <button
                className="btn-sm"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
                onClick={(e) => toggleSave(featured.id, e)}
              >
                <MS n={savedByEventId.has(featured.id) ? "bookmark" : "bookmark_add"} size={13} />
                {savedByEventId.has(featured.id) ? "Saved" : "Save"}
              </button>
            </div>
          </div>
          <div
            style={{ background: "linear-gradient(135deg,#1a2750,#050a26)", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg,#121d3f,transparent 30%)",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className="text-center py-16"
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            marginBottom: 24,
            border: "1px solid var(--outline)",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--on-mut)",
            }}
          >
            No events found.
          </p>
        </div>
      )}

      {/* calendar view */}
      {viewMode === "calendar" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={events.map((ev) => ({
              id: ev.id,
              title: ev.title,
              start: ev.start_date,
              end: ev.end_date,
              // use the platform accent colours based on event status
              backgroundColor:
                ev.status === "published"
                  ? "#050a26"
                  : ev.status === "cancelled"
                    ? "#e83151"
                    : "#6b7280",
              borderColor: "transparent",
              extendedProps: { event: ev },
            }))}
            eventClick={(info: { event: { id: string } }) => {
              navigate(`/events/${info.event.id}`);
            }}
            height="auto"
          />
        </div>
      )}

      {/* event grid - only shown in grid mode */}
      {viewMode === "grid" &&
        (isLoading ? (
          <div className="disc-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: 300, borderRadius: 16, background: "var(--surface)" }}
              />
            ))}
          </div>
        ) : (
          <div className="disc-grid">
            {events.map((ev) => {
              const f = fillPercent(ev);
              const priceLabel = ev.is_free
                ? "Free"
                : `NPR ${parseFloat(ev.price).toLocaleString()}`;
              return (
                <div key={ev.id} className="disc-card" onClick={() => navigate(`/events/${ev.id}`)}>
                  <div
                    className="disc-hero"
                    style={{ background: "linear-gradient(135deg,#1a2750,#050a26)" }}
                  >
                    <span className="disc-date">{shortDate(ev.start_date)}</span>
                    {f > 85 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          zIndex: 1,
                          background: "#e83151",
                          color: "white",
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "JetBrains Mono, monospace",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Filling fast
                      </span>
                    )}
                  </div>
                  <div className="disc-body">
                    <div
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 9.5,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--secondary)",
                        fontWeight: 700,
                      }}
                    >
                      {ev.status}
                    </div>
                    <div className="disc-title">{ev.title}</div>
                    <div className="disc-meta">
                      {ev.location} &middot; {ev.registered_count.toLocaleString()} attending
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "var(--mid)",
                        borderRadius: 999,
                        overflow: "hidden",
                        margin: "4px 0 2px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${f}%`,
                          background: f > 85 ? "#e83151" : f > 60 ? "#dba13d" : "#16a34a",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div className="disc-foot">
                      <span className="disc-price">{priceLabel}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* per-card save (issue 20) */}
                        <button
                          className="btn-sm"
                          onClick={(e) => toggleSave(ev.id, e)}
                          style={{ fontSize: 11 }}
                        >
                          <MS
                            n={savedByEventId.has(ev.id) ? "bookmark" : "bookmark_add"}
                            size={12}
                          />
                          {savedByEventId.has(ev.id) ? "Saved" : "Save"}
                        </button>
                        <button
                          className="btn-sm primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}`);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </AppLayout>
  );
}
