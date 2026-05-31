import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS } from "@/shared/components/v8";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";

// fix leaflet's broken default icon paths when bundled with vite
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// nepal geographic center - used when no user location is available
const NEPAL_CENTER: [number, number] = [27.7, 85.3];

/** Pre-written suggestions shown before the user types anything. */
const SUGGESTIONS = ["Tech", "Music", "Workshop", "Networking", "Leadership", "Kathmandu"];

/** Formats an ISO date string into a short label like "Jun 15, 2026". */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

/**
 * Formats a kilometre distance into a concise label.
 * @param km - distance in kilometres
 * @returns display string e.g. "2.5 km" or "12 km"
 */
function fmtDistance(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Search page - queries the event-service and renders matching event cards. */
export default function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [q, setQ] = useState(initial);

  // * geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  // * map preview toggle - collapsed by default, revealed after search
  const [mapOpen, setMapOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["event-search", q],
    queryFn: () => eventsApi.listPublicEvents({ search: q }),
    enabled: q.trim().length > 0,
  });

  const results: Event[] = data?.results ?? [];

  // events with coordinates - used for map markers
  const mappableResults = results.filter(
    (ev) => ev.latitude !== null && ev.longitude !== null
  ) as (Event & { latitude: number; longitude: number })[];

  /** Commit the current input as the active search query. */
  function handleSearch() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setQ(trimmed);
    setParams({ q: trimmed });
  }

  /**
   * Request browser geolocation. Stores the position on success or
   * records the error message so the UI can surface it.
   */
  function requestLocation() {
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
  }

  return (
    <AppLayout variant="user">
      {/* keyframe for the pulsing location dot */}
      <style>{`
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>

      <PH
        crumbs={["Discover", "Search"]}
        title="Search events"
        sub="Find events by name, location, or keyword."
      />

      {/* search box */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-body">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <MS n="search" size={20} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
            <input
              className="field-in"
              style={{
                flex: 1,
                fontSize: 16,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by event name, location, keyword..."
            />

            {/* near me toggle */}
            {userLocation ? (
              <button
                className="btn-sm primary"
                onClick={() => {
                  setUserLocation(null);
                  setLocationError("");
                }}
                title="Clear location"
                style={{ flexShrink: 0 }}
              >
                <MS n="location_off" size={13} />
                Clear location
              </button>
            ) : (
              <button
                className="btn-sm"
                disabled={locating}
                onClick={requestLocation}
                title="Show distance to each result"
                style={{ flexShrink: 0 }}
              >
                {locating ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#e83151",
                        marginRight: 6,
                        animation: "sp-pulse 1.2s ease-in-out infinite",
                      }}
                    />
                    Locating…
                  </>
                ) : (
                  <>
                    <MS n="my_location" size={13} />
                    Near me
                  </>
                )}
              </button>
            )}

            <button
              className="btn-sm primary"
              onClick={handleSearch}
              disabled={!input.trim() || isLoading}
              style={{ flexShrink: 0 }}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* location error inline below the input row */}
          {locationError && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--secondary)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Location error: {locationError}
            </p>
          )}

          {/* location active notice */}
          {userLocation && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <MS n="near_me" size={13} style={{ color: "var(--on-mut)" }} />
              Showing distances from your location
            </p>
          )}
        </div>
      </div>

      {/* active query indicator */}
      {q && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          <span>
            Showing results for: <strong>{q}</strong>
          </span>
          <button
            onClick={() => {
              setInput("");
              setQ("");
              setParams({});
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--on-mut)",
              padding: 0,
            }}
          >
            <MS n="close" size={16} />
          </button>
        </div>
      )}

      {/* error state */}
      {isError && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--error)", padding: "32px 0" }}
          >
            Something went wrong. Please try again.
          </div>
        </div>
      )}

      {/* results grid */}
      {q && !isLoading && !isError && results.length > 0 && (
        <>
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--on-mut)",
              letterSpacing: "0.06em",
            }}
          >
            {results.length} event{results.length !== 1 ? "s" : ""} found
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
          >
            {results.map((ev) => {
              // compute haversine distance only when we have user location and event coords
              const distKm =
                userLocation && ev.latitude !== null && ev.longitude !== null
                  ? haversineKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude)
                  : null;
              return (
                <div
                  key={ev.id}
                  className="panel"
                  style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                  onClick={() => navigate(`/events/${ev.id}`)}
                >
                  <div
                    style={{
                      height: 140,
                      background: ev.cover_image
                        ? `url(${ev.cover_image}) center/cover`
                        : "linear-gradient(135deg, #050a26, #121d3f)",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: ev.is_free ? "rgba(34,197,94,0.9)" : "rgba(5,10,38,0.85)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {ev.is_free ? "FREE" : `NPR ${parseFloat(ev.price).toLocaleString()}`}
                    </span>
                    {/* distance badge - only shown when user location is available and event has coords */}
                    {distKm !== null && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "rgba(5,10,38,0.8)",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {fmtDistance(distKm)} away
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: "-0.02em",
                        color: "var(--on-bg)",
                        marginBottom: 6,
                        lineHeight: 1.25,
                      }}
                    >
                      {ev.title}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--on-var)",
                          fontFamily: "Manrope, sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MS n="calendar_today" size={14} style={{ color: "var(--on-mut)" }} />
                        {fmtDate(ev.start_date)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--on-var)",
                          fontFamily: "Manrope, sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MS n="location_on" size={14} style={{ color: "var(--on-mut)" }} />
                        {ev.location}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px solid var(--outline)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "var(--on-mut)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {ev.registered_count}/{ev.capacity} attending
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* collapsible map preview - only rendered when there are mappable results */}
          {mappableResults.length > 0 && (
            <div
              style={{
                marginTop: 24,
                border: "1px solid var(--outline)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* toggle header */}
              <button
                onClick={() => setMapOpen((o) => !o)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--surface)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MS n="map" size={15} />
                  Map preview · {mappableResults.length} event
                  {mappableResults.length !== 1 ? "s" : ""} on map
                </span>
                <MS n={mapOpen ? "expand_less" : "expand_more"} size={18} />
              </button>

              {/* map - rendered only when open to avoid loading leaflet tiles unnecessarily */}
              {mapOpen && (
                <MapContainer
                  center={userLocation ? [userLocation.lat, userLocation.lng] : NEPAL_CENTER}
                  zoom={userLocation ? 12 : 7}
                  style={{ width: "100%", height: 400 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="OpenStreetMap contributors"
                  />

                  {/* user's position marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 13 }}>
                          Your location
                        </span>
                      </Popup>
                    </Marker>
                  )}

                  {/* one marker per result that has coordinates */}
                  {mappableResults.map((ev) => {
                    const priceLabel = ev.is_free
                      ? "Free"
                      : `NPR ${parseFloat(ev.price).toLocaleString()}`;
                    const distLabel = userLocation
                      ? fmtDistance(
                          haversineKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude)
                        )
                      : null;
                    return (
                      <Marker key={ev.id} position={[ev.latitude, ev.longitude]}>
                        <Popup>
                          <div style={{ fontFamily: "Manrope, sans-serif", minWidth: 170 }}>
                            <p
                              style={{
                                fontFamily: "Space Grotesk, sans-serif",
                                fontWeight: 700,
                                fontSize: 14,
                                marginBottom: 4,
                                lineHeight: 1.25,
                              }}
                            >
                              {ev.title}
                            </p>
                            <p style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                              {fmtDate(ev.start_date)}
                            </p>
                            <p style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                              {priceLabel}
                            </p>
                            {distLabel && (
                              <p style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                                {distLabel} away
                              </p>
                            )}
                            <button
                              onClick={() => navigate(`/events/${ev.id}`)}
                              style={{
                                marginTop: 4,
                                padding: "4px 12px",
                                borderRadius: 6,
                                background: "#050a26",
                                color: "white",
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "Manrope, sans-serif",
                              }}
                            >
                              View event
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          )}
        </>
      )}

      {/* no results */}
      {q && !isLoading && !isError && results.length === 0 && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--on-mut)", padding: "40px 0" }}
          >
            <MS
              n="search_off"
              size={32}
              style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }}
            />
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--on-bg)",
                marginBottom: 6,
              }}
            >
              No events found
            </p>
            <p style={{ fontSize: 13, fontFamily: "Manrope, sans-serif" }}>
              Try a different keyword or browse all events.
            </p>
            <button
              className="btn-sm primary"
              onClick={() => navigate("/events")}
              style={{ marginTop: 16 }}
            >
              <MS n="explore" size={14} />
              Browse all events
            </button>
          </div>
        </div>
      )}

      {/* suggestion chips shown before first search */}
      {!q && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Popular searches</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    setQ(s);
                    setParams({ q: s });
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 20,
                    border: "1px solid var(--outline)",
                    background: "var(--surface)",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 13,
                    color: "var(--on-var)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="search" size={14} style={{ color: "var(--on-mut)" }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
