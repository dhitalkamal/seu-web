import { lazy, Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useOrgStore } from "@/shared/store/org.store";
import venuesApi from "../api/venues.api";

// lazy load so leaflet CSS doesn't block the venues bundle
const EventMap = lazy(() => import("@/shared/components/EventMap"));

export default function VenuesPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const [showModal, setShowModal] = useState(false);
  // track which venue row has its map expanded
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nepal");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues", orgId],
    queryFn: () => venuesApi.list(orgId),
    enabled: !!orgId,
  });

  /** Reset all form fields and close the modal. */
  function closeModal() {
    setShowModal(false);
    setName("");
    setAddress("");
    setCity("");
    setCountry("Nepal");
    setCapacity("");
    setDescription("");
    setWebsite("");
    setLat(null);
    setLng(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      venuesApi.create({
        name,
        address,
        city,
        country,
        capacity: Number(capacity),
        organisation_id: orgId,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        description: description || undefined,
        website: website || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      toast("Venue created");
      closeModal();
    },
    onError: () => toast("Failed to create venue"),
  });

  const totalCapacity = venues.reduce((s, v) => s + (v.capacity ?? 0), 0);

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Venues"]}
        title="Venues register"
        sub="Manage locations, monitor utilisation, and assign venues to events."
        actions={
          <button className="btn-sm primary" onClick={() => setShowModal(true)}>
            <MS n="add" size={13} />
            New venue
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI icon="location_on" color="lav" label="Total venues" value={venues.length.toString()} />
        <KPI
          icon="groups"
          color="mnt"
          label="Total capacity"
          value={totalCapacity.toLocaleString()}
        />
        <KPI icon="event_available" color="pch" label="Active" value={venues.length.toString()} />
        <KPI
          icon="map"
          color="nav"
          label="Cities"
          value={new Set(venues.map((v) => v.city)).size.toString()}
        />
      </div>

      {/* new venue modal */}
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
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }}
          >
            {/* modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MS n="location_on" size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>New venue</div>
                  <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 2 }}>
                    Add a new location to the venues register
                  </div>
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
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
              {/* name */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Grand Conference Hall"
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

              {/* capacity */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Capacity <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="500"
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

              {/* address */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Address <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
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

              {/* city */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  City <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kathmandu"
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

              {/* country */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Country <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
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
            </div>

            {/* map picker */}
            <div style={{ padding: "0 24px 16px" }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  marginBottom: 6,
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Location on map{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  (click to set pin)
                </span>
              </label>
              <Suspense fallback={<div style={{ height: 200, background: "var(--low)", borderRadius: 12 }} />}>
                <div style={{ height: 200, borderRadius: 12, overflow: "hidden", border: "1px solid var(--mid)" }}>
                  <EventMap
                    latitude={lat ?? 27.7172}
                    longitude={lng ?? 85.324}
                    title={name || "Venue location"}
                    className=""
                    onClick={(newLat: number, newLng: number) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                  />
                </div>
              </Suspense>
              {lat != null && lng != null && (
                <div style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </div>
              )}
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
                className="btn-sm"
                onClick={closeModal}
                style={{ border: "1px solid var(--mid)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                className="btn-sm"
                onClick={() => createMutation.mutate()}
                disabled={
                  !name || !capacity || !address || !city || !country || createMutation.isPending
                }
                style={{
                  background:
                    !name || !capacity || !address || !city || !country || createMutation.isPending
                      ? "var(--mid)"
                      : "#050a26",
                  color: "white",
                  border: "none",
                }}
              >
                {createMutation.isPending ? "Saving..." : "Create venue"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">All venues</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10.5,
              color: "var(--on-mut)",
            }}
          >
            {venues.length} total
          </span>
        </div>
        <div className="panel-body flush">
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
              Loading...
            </div>
          ) : venues.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <MS
                n="location_off"
                size={32}
                style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }}
              />
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No venues yet</p>
              <p style={{ fontSize: 13, color: "var(--on-mut)" }}>
                Add your first venue to assign it to events.
              </p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Capacity</th>
                  <th>Since</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <>
                    <tr key={v.id}>
                      <td>
                        <div className="ev-cell">
                          <div
                            className="ev-icon"
                            style={{
                              background: "linear-gradient(135deg,#1b4a5c,#3b3a72)",
                              color: "white",
                            }}
                          >
                            <MS n="location_on" size={14} />
                          </div>
                          <div>
                            <div className="ev-name">{v.name}</div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--on-mut)",
                                fontFamily: "JetBrains Mono, monospace",
                              }}
                            >
                              {v.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{v.city}</td>
                      <td>{v.country}</td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                        {v.capacity?.toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          color: "var(--on-mut)",
                        }}
                      >
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {/* show map toggle only when the backend provides coordinates */}
                        {v.latitude != null && v.longitude != null && (
                          <button
                            className="btn-sm"
                            onClick={() =>
                              setExpandedMapId((prev) => (prev === v.id ? null : v.id))
                            }
                            style={{ fontSize: 11 }}
                          >
                            <MS n="map" size={12} />
                            {expandedMapId === v.id ? "Hide map" : "Map"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* inline map row - only rendered when the toggle is active */}
                    {expandedMapId === v.id && v.latitude != null && v.longitude != null && (
                      <tr key={`${v.id}-map`}>
                        <td colSpan={6} style={{ padding: "12px 16px" }}>
                          <Suspense
                            fallback={
                              <div
                                style={{
                                  height: 200,
                                  background: "var(--low)",
                                  borderRadius: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  color: "var(--on-mut)",
                                }}
                              >
                                Loading map…
                              </div>
                            }
                          >
                            <EventMap
                              latitude={v.latitude}
                              longitude={v.longitude}
                              title={`${v.name} - ${v.address}`}
                              className="venue-map"
                            />
                          </Suspense>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
