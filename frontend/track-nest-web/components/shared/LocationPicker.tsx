"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDebounce } from "use-debounce";
import { Search, X, Loader2 } from "lucide-react";
import {
  searchLocations,
  reverseGeocode,
  GeocodingResult,
} from "@/utils/geocoding";

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
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery] = useDebounce(inputValue, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipReverseRef = useRef(false);

  // Hide suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Forward geocoding with debounced query
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchLocations(debouncedQuery).then((results) => {
      if (cancelled) return;
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Reverse geocode whenever position changes (from map click or drag)
  useEffect(() => {
    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }
    let cancelled = false;
    reverseGeocode(position[0], position[1]).then((label) => {
      if (cancelled || label === null) return;
      setInputValue(label);
      setSuggestions([]);
      setShowSuggestions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [position]);

  const handleSuggestionSelect = useCallback(
    (result: GeocodingResult) => {
      skipReverseRef.current = true;
      setInputValue(result.label);
      setSuggestions([]);
      setShowSuggestions(false);
      onPositionChange([result.lat, result.lng]);
    },
    [onPositionChange],
  );

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

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
          <Marker
            position={position}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                onPositionChange([lat, lng]);
              },
            }}
          />
          <MapClickHandler onPositionChange={onPositionChange} />
          <MapCenterHandler position={position} />
        </MapContainer>
      </div>

      {/* Search input below map */}
      <div ref={containerRef} className="relative">
        <div className="relative flex items-center">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a location…"
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionSelect(s);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 truncate"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>Click or drag the marker to select a location</span>
        <span className="font-mono text-gray-700">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </span>
      </div>
    </div>
  );
}
