import { SafeZone } from "@/constant/types";

// Mock safe zones used in map overlays and safe-zones screen.
export const MOCK_SAFE_ZONES: SafeZone[] = [
  {
    id: "sz-1",
    name: "Central School Safe Zone",
    latitude: 10.7769,
    longitude: 106.7009,
    radiusMeters: 220,
  },
  {
    id: "sz-2",
    name: "District Hospital Safe Zone",
    latitude: 10.7821,
    longitude: 106.6954,
    radiusMeters: 300,
  },
  {
    id: "sz-3",
    name: "Community Center Safe Zone",
    latitude: 10.7712,
    longitude: 106.7082,
    radiusMeters: 180,
  },
  {
    id: "sz-4",
    name: "Riverside Shelter Safe Zone",
    latitude: 10.7684,
    longitude: 106.7141,
    radiusMeters: 260,
  },
  {
    id: "sz-5",
    name: "North Police Post Safe Zone",
    latitude: 10.7866,
    longitude: 106.7065,
    radiusMeters: 200,
  },
];
