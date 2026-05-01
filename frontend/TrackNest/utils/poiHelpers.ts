import type { POICategory } from "@/types/poiAndAnalytics";

export function getPOIIcon(category: POICategory): string {
  const icons: Record<POICategory, string> = {
    police_station: "shield",
    hospital: "medkit",
    school: "school",
    fire_station: "flame",
    pharmacy: "medical",
    bank: "card",
    shopping_mall: "cart",
    public_transport: "bus",
    park: "leaf",
    other: "location",
  };
  return icons[category] || "location";
}

export function getPOIColor(category: POICategory): string {
  const colors: Record<POICategory, string> = {
    police_station: "#1a73e8",
    hospital: "#ea4335",
    school: "#fbbc04",
    fire_station: "#ff6d00",
    pharmacy: "#34a853",
    bank: "#7b1fa2",
    shopping_mall: "#00acc1",
    public_transport: "#5f6368",
    park: "#4caf50",
    other: "#757575",
  };
  return colors[category] || "#757575";
}

export function getHeatmapSeverityColor(severity: number): string {
  if (severity >= 4) return "#e74c3c";
  if (severity >= 3) return "#f39c12";
  if (severity >= 2) return "#f1c40f";
  return "#27ae60";
}

export function getHeatmapRadius(severity: number): number {
  return 100 + severity * 50;
}

export function getHeatmapOpacity(severity: number): number {
  return 0.3 + severity * 0.15;
}

export function calculateRiskLevel(
  crimeCount: number,
  maxSeverity: number,
): "low" | "medium" | "high" {
  if (crimeCount === 0) return "low";
  if (crimeCount >= 10 || maxSeverity >= 5) return "high";
  if (crimeCount >= 5 || maxSeverity >= 4) return "medium";
  return "low";
}
