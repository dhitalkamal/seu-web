import { lazy, Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import venuesApi from "../api/venues.api";

// lazy load so leaflet CSS doesn't block the venues bundle
const EventMap = lazy(() => import("@/shared/components/EventMap"));

export default function VenuesPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  // track which venue row has its map expanded
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nepal");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues"],
    queryFn: venuesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      venuesApi.create({
        name,
        address,
        city,
        country,
        capacity: Number(capacity),
        description: description || undefined,
        website: website || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      toast("Venue created");
      setShowForm(false);
      setName("");
      setAddress("");
      setCity("");
      setCapacity("");
      setDescription("");
      setWebsite("");
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
          <button className="btn-sm primary" onClick={() => setShowForm((p) => !p)}>
            <MS n="add" size={13} />
            {showForm ? "Cancel" : "Add venue"}
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

      {showForm && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">New venue</span>
          </div>
          <div
            className="panel-body"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div className="field">
              <label className="field-lab">Name</label>
              <input
                className="field-in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grand Conference Hall"
              />
            </div>
            <div className="field">
              <label className="field-lab">Capacity</label>
              <input
                className="field-in"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="field">
              <label className="field-lab">Address</label>
              <input
                className="field-in"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="field">
              <label className="field-lab">City</label>
              <input
                className="field-in"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kathmandu"
              />
            </div>
            <div className="field">
              <label className="field-lab">Country</label>
              <input
                className="field-in"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn-sm primary"
                onClick={() => createMutation.mutate()}
                disabled={!name || !capacity || createMutation.isPending}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {createMutation.isPending ? "Saving..." : "Save venue"}
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
