"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
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

interface LocationPickerProps {
  position: [number, number];
  onPositionChange: (position: [number, number]) => void;
}

// Component to handle map click events
function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Component to handle centering the map when position changes externally
function MapCenterHandler({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);

  return null;
}

export function LocationPicker({
  position,
  onPositionChange,
}: LocationPickerProps) {
  return (
    <div className="space-y-2">
      <div className="h-[480px] rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={position}
          zoom={13}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={defaultIcon} />
          <MapClickHandler onPositionChange={onPositionChange} />
          <MapCenterHandler position={position} />
        </MapContainer>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>Click on the map to select a location</span>
        <span className="font-mono text-gray-700">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </span>
      </div>
    </div>
  );
}
