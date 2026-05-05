import {
  getPOIIcon,
  getPOIColor,
  getHeatmapSeverityColor,
  getHeatmapRadius,
  getHeatmapOpacity,
  calculateRiskLevel,
} from "@/utils/poiHelpers";
import type { POICategory } from "@/types/poiAndAnalytics";

const ALL_CATEGORIES: POICategory[] = [
  "police_station",
  "hospital",
  "school",
  "fire_station",
  "pharmacy",
  "bank",
  "shopping_mall",
  "public_transport",
  "park",
  "other",
];

describe("getPOIIcon", () => {
  it("returns the correct icon for each known category", () => {
    expect(getPOIIcon("police_station")).toBe("shield");
    expect(getPOIIcon("hospital")).toBe("medkit");
    expect(getPOIIcon("school")).toBe("school");
    expect(getPOIIcon("fire_station")).toBe("flame");
    expect(getPOIIcon("pharmacy")).toBe("medical");
    expect(getPOIIcon("bank")).toBe("card");
    expect(getPOIIcon("shopping_mall")).toBe("cart");
    expect(getPOIIcon("public_transport")).toBe("bus");
    expect(getPOIIcon("park")).toBe("leaf");
    expect(getPOIIcon("other")).toBe("location");
  });

  it("returns 'location' for an unknown category", () => {
    expect(getPOIIcon("unknown" as POICategory)).toBe("location");
  });

  it("returns a non-empty string for every known category", () => {
    ALL_CATEGORIES.forEach((cat) => {
      expect(typeof getPOIIcon(cat)).toBe("string");
      expect(getPOIIcon(cat).length).toBeGreaterThan(0);
    });
  });
});

describe("getPOIColor", () => {
  it("returns the correct hex color for each known category", () => {
    expect(getPOIColor("police_station")).toBe("#1a73e8");
    expect(getPOIColor("hospital")).toBe("#ea4335");
    expect(getPOIColor("school")).toBe("#fbbc04");
    expect(getPOIColor("fire_station")).toBe("#ff6d00");
    expect(getPOIColor("pharmacy")).toBe("#34a853");
    expect(getPOIColor("bank")).toBe("#7b1fa2");
    expect(getPOIColor("shopping_mall")).toBe("#00acc1");
    expect(getPOIColor("public_transport")).toBe("#5f6368");
    expect(getPOIColor("park")).toBe("#4caf50");
    expect(getPOIColor("other")).toBe("#757575");
  });

  it("returns default gray for an unknown category", () => {
    expect(getPOIColor("unknown" as POICategory)).toBe("#757575");
  });

  it("returns a hex color string for every known category", () => {
    ALL_CATEGORIES.forEach((cat) => {
      expect(getPOIColor(cat)).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe("getHeatmapSeverityColor", () => {
  it("returns red (#e74c3c) for severity >= 4", () => {
    expect(getHeatmapSeverityColor(4)).toBe("#e74c3c");
    expect(getHeatmapSeverityColor(5)).toBe("#e74c3c");
    expect(getHeatmapSeverityColor(10)).toBe("#e74c3c");
  });

  it("returns orange (#f39c12) for severity >= 3 and < 4", () => {
    expect(getHeatmapSeverityColor(3)).toBe("#f39c12");
    expect(getHeatmapSeverityColor(3.5)).toBe("#f39c12");
  });

  it("returns yellow (#f1c40f) for severity >= 2 and < 3", () => {
    expect(getHeatmapSeverityColor(2)).toBe("#f1c40f");
    expect(getHeatmapSeverityColor(2.9)).toBe("#f1c40f");
  });

  it("returns green (#27ae60) for severity < 2", () => {
    expect(getHeatmapSeverityColor(1)).toBe("#27ae60");
    expect(getHeatmapSeverityColor(0)).toBe("#27ae60");
    expect(getHeatmapSeverityColor(-1)).toBe("#27ae60");
  });
});

describe("getHeatmapRadius", () => {
  it("returns 100 for severity 0", () => {
    expect(getHeatmapRadius(0)).toBe(100);
  });

  it("increases by 50 per severity unit", () => {
    expect(getHeatmapRadius(1)).toBe(150);
    expect(getHeatmapRadius(2)).toBe(200);
    expect(getHeatmapRadius(5)).toBe(350);
  });
});

describe("getHeatmapOpacity", () => {
  it("returns 0.3 for severity 0", () => {
    expect(getHeatmapOpacity(0)).toBeCloseTo(0.3);
  });

  it("increases by 0.15 per severity unit", () => {
    expect(getHeatmapOpacity(1)).toBeCloseTo(0.45);
    expect(getHeatmapOpacity(2)).toBeCloseTo(0.6);
  });
});

describe("calculateRiskLevel", () => {
  it("returns 'low' when crimeCount is 0", () => {
    expect(calculateRiskLevel(0, 0)).toBe("low");
    expect(calculateRiskLevel(0, 5)).toBe("low");
  });

  it("returns 'high' when crimeCount >= 10", () => {
    expect(calculateRiskLevel(10, 1)).toBe("high");
    expect(calculateRiskLevel(20, 0)).toBe("high");
  });

  it("returns 'high' when maxSeverity >= 5", () => {
    expect(calculateRiskLevel(1, 5)).toBe("high");
    expect(calculateRiskLevel(3, 6)).toBe("high");
  });

  it("returns 'medium' when crimeCount >= 5 (and not high)", () => {
    expect(calculateRiskLevel(5, 1)).toBe("medium");
    expect(calculateRiskLevel(7, 2)).toBe("medium");
  });

  it("returns 'medium' when maxSeverity >= 4 (and not high)", () => {
    expect(calculateRiskLevel(2, 4)).toBe("medium");
  });

  it("returns 'low' for low crime and low severity", () => {
    expect(calculateRiskLevel(3, 2)).toBe("low");
    expect(calculateRiskLevel(1, 1)).toBe("low");
  });
});
