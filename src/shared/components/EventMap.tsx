import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix leaflet's broken default icon paths when bundled with vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

type EventMapProps = {
  latitude: number;
  longitude: number;
  title?: string;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
};

/** Captures map click events and forwards lat/lng to the parent. */
function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Renders a Leaflet map centered on the given coordinates with a single marker.
 * Uses OpenStreetMap tiles - no API key required.
 * @param latitude - decimal latitude
 * @param longitude - decimal longitude
 * @param title - label shown in the popup when the marker is clicked
 * @param className - optional CSS class passed to the container div
 */
export default function EventMap({ latitude, longitude, title, className, onClick }: EventMapProps) {
  // patch leaflet's icon paths once on mount - vite strips the default asset refs
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
    });
  }, []);

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      className={className}
      style={{ height: "300px", borderRadius: "12px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap"
      />
      <ClickHandler onClick={onClick} />
      <Marker position={[latitude, longitude]}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}
