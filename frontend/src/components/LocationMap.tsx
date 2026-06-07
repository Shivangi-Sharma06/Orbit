"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Location } from "@/lib/types";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export function LocationMap({ locations }: { locations: Location[] }) {
  const points = locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]).reverse();
  const center = points.at(-1) ?? [28.6139, 77.209];

  return (
    <MapContainer center={center} zoom={points.length ? 15 : 11} style={{ minHeight: 520 }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.length > 0 && <Polyline positions={points} color="#3b82f6" />}
      {locations[0] && (
        <Marker position={[locations[0].latitude, locations[0].longitude]} icon={markerIcon}>
          <Popup>{locations[0].deviceId}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
