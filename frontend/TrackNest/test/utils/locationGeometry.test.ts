import {
  distanceMeters,
  isSamePlace,
  isPoorAccuracy,
  STAY_RADIUS_METERS,
  POOR_ACCURACY_THRESHOLD_METERS,
} from "@/utils/locationGeometry";

describe("constants", () => {
  it("exports STAY_RADIUS_METERS as 100", () => {
    expect(STAY_RADIUS_METERS).toBe(100);
  });

  it("exports POOR_ACCURACY_THRESHOLD_METERS as 50", () => {
    expect(POOR_ACCURACY_THRESHOLD_METERS).toBe(50);
  });
});

describe("distanceMeters", () => {
  it("returns ~0 for identical points", () => {
    const p = { latitude: 10, longitude: 20 };
    expect(distanceMeters(p, p)).toBeCloseTo(0, 5);
  });

  it("calculates a short distance correctly (~111m per 0.001°)", () => {
    const a = { latitude: 10.0, longitude: 20.0 };
    const b = { latitude: 10.001, longitude: 20.0 };
    const d = distanceMeters(a, b);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });

  it("calculates a large intercontinental distance (NYC ↔ London)", () => {
    const nyc = { latitude: 40.7128, longitude: -74.006 };
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const d = distanceMeters(nyc, london);
    expect(d).toBeGreaterThan(5_500_000);
    expect(d).toBeLessThan(5_700_000);
  });

  it("is approximately symmetric", () => {
    const a = { latitude: 21.0278, longitude: 105.8342 };
    const b = { latitude: 10.8231, longitude: 106.6297 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 0);
  });

  it("works at the equator across the prime meridian", () => {
    const west = { latitude: 0, longitude: -0.001 };
    const east = { latitude: 0, longitude: 0.001 };
    const d = distanceMeters(west, east);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(300);
  });
});

describe("isSamePlace", () => {
  it("returns true for identical points", () => {
    const p = { latitude: 0, longitude: 0 };
    expect(isSamePlace(p, p)).toBe(true);
  });

  it("returns true for points within STAY_RADIUS_METERS (50m apart)", () => {
    const a = { latitude: 10.0, longitude: 20.0 };
    const b = { latitude: 10.0004, longitude: 20.0 }; // ~44m
    expect(isSamePlace(a, b)).toBe(true);
  });

  it("returns false for points further than STAY_RADIUS_METERS", () => {
    const a = { latitude: 10, longitude: 20 };
    const b = { latitude: 10.002, longitude: 20 }; // ~222m
    expect(isSamePlace(a, b)).toBe(false);
  });

  it("returns false for far-apart points", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 1, longitude: 1 };
    expect(isSamePlace(a, b)).toBe(false);
  });
});

describe("isPoorAccuracy", () => {
  it("returns false when accuracy is exactly the threshold (50)", () => {
    expect(isPoorAccuracy(50)).toBe(false);
  });

  it("returns true when accuracy exceeds the threshold", () => {
    expect(isPoorAccuracy(51)).toBe(true);
    expect(isPoorAccuracy(100)).toBe(true);
  });

  it("returns false when accuracy is below the threshold", () => {
    expect(isPoorAccuracy(0)).toBe(false);
    expect(isPoorAccuracy(10)).toBe(false);
    expect(isPoorAccuracy(49)).toBe(false);
  });
});
