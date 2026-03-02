"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Rectangle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MarkerData {
  position: [number, number];
  label: string;
  popup?: string;
}

interface ZoneData {
  type: "circle" | "rectangle";
  center?: [number, number];
  radius?: number;
  bounds?: [[number, number], [number, number]];
  color?: string;
}

interface MapViewProps {
  center: [number, number];
  markers?: MarkerData[];
  zones?: ZoneData[];
  heatmapData?: [number, number, number][]; // [lat, lng, intensity]
  height?: string;
}

// Component to handle map bounds fitting
function MapBoundsHandler({
  markers,
  center,
}: {
  markers: MarkerData[];
  center: [number, number];
}) {
  const map = useMap();

  useMemo(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      map.setView(markers[0].position, 13);
    } else {
      map.setView(center, 13);
    }
  }, [map, markers, center]);

  return null;
}

export function MapView({
  center,
  markers = [],
  zones = [],
  heatmapData = [],
  height = "100%",
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="rounded-lg flex-1 z-10"
      style={{ height }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Markers */}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position} icon={defaultIcon}>
          <Popup>{marker.popup || marker.label}</Popup>
        </Marker>
      ))}

      {/* Zones */}
      {zones.map((zone, index) => {
        if (zone.type === "circle" && zone.center && zone.radius) {
          return (
            <Circle
              key={`zone-${index}`}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: zone.color || "red",
                fillColor: zone.color || "red",
                fillOpacity: 0.2,
              }}
            />
          );
        }
        if (zone.type === "rectangle" && zone.bounds) {
          return (
            <Rectangle
              key={`zone-${index}`}
              bounds={zone.bounds}
              pathOptions={{
                color: zone.color || "red",
                fillColor: zone.color || "red",
                fillOpacity: 0.2,
              }}
            />
          );
        }
        return null;
      })}

      {/* Heatmap (simplified using circles with varying opacity) */}
      {heatmapData.map(([lat, lng, intensity], index) => (
        <Circle
          key={`heat-${index}`}
          center={[lat, lng]}
          radius={200}
          pathOptions={{
            color: "red",
            fillColor: "red",
            fillOpacity: Math.min(intensity / 10, 0.6),
            weight: 0,
          }}
        />
      ))}

      {/* Handle map bounds */}
      <MapBoundsHandler markers={markers} center={center} />
    </MapContainer>
  );
}
