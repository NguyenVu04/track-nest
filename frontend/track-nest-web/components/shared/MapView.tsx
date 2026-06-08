"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Rectangle,
  useMap,
  useMapEvents,
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
  onMapClick?: (position: [number, number]) => void;
  onMarkerDragEnd?: (position: [number, number]) => void;
  /** Fly to markers[index] and open its popup. Increment key to re-trigger for the same index. */
  flyTarget?: { index: number; key: number };
  /** Called when a marker is clicked, with its index into the markers array. */
  onMarkerClick?: (index: number) => void;
  /** When true, suppresses the automatic fitBounds/setView behaviour. */
  disableAutoFit?: boolean;
}

// Component to handle map bounds fitting
function MapBoundsHandler({
  markers,
  center,
  skip,
}: {
  markers: MarkerData[];
  center: [number, number];
  skip?: boolean;
}) {
  const map = useMap();

  useMemo(() => {
    if (skip) return;
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      map.setView(markers[0].position, 13);
    } else {
      map.setView(center, 13);
    }
  }, [map, markers, center, skip]);

  return null;
}

// Animates the map to a target marker and opens its popup.
function MapFlyController({
  flyTarget,
  markers,
  markerRefs,
}: {
  flyTarget?: { index: number; key: number };
  markers: MarkerData[];
  markerRefs: React.MutableRefObject<(L.Marker | null)[]>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!flyTarget) return;
    const target = markers[flyTarget.index];
    if (!target) return;

    map.flyTo(target.position, 15, { animate: true, duration: 0.8 });

    const onMoveEnd = () => {
      markerRefs.current[flyTarget.index]?.openPopup();
      map.off("moveend", onMoveEnd);
    };
    map.on("moveend", onMoveEnd);

    return () => {
      map.off("moveend", onMoveEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTarget]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick?.([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export function MapView({
  center,
  markers = [],
  zones = [],
  heatmapData = [],
  height = "100%",
  onMapClick,
  onMarkerDragEnd,
  flyTarget,
  onMarkerClick,
  disableAutoFit,
}: MapViewProps) {
  const markerRefs = useRef<(L.Marker | null)[]>([]);

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
        <Marker
          key={index}
          ref={(m) => { markerRefs.current[index] = m; }}
          position={marker.position}
          icon={defaultIcon}
          draggable={!!onMarkerDragEnd}
          eventHandlers={{
            ...(onMarkerDragEnd
              ? {
                  dragend(e) {
                    const { lat, lng } = e.target.getLatLng();
                    onMarkerDragEnd([lat, lng]);
                  },
                }
              : {}),
            ...(onMarkerClick
              ? { click: () => onMarkerClick(index) }
              : {}),
          }}
        >
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

      <MapBoundsHandler markers={markers} center={center} skip={disableAutoFit} />
      <MapFlyController flyTarget={flyTarget} markers={markers} markerRefs={markerRefs} />
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
}
