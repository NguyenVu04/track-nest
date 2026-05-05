import React from "react";
import { renderHook } from "@testing-library/react-native";
import { useMockFollowers } from "@/hooks/useMockFollowers";

describe("useMockFollowers", () => {
  it("always returns exactly 6 followers", () => {
    const { result } = renderHook(() => useMockFollowers(10, 20));
    expect(result.current).toHaveLength(6);
  });

  it("each follower has all required fields", () => {
    const { result } = renderHook(() => useMockFollowers(0, 0));
    result.current.forEach((f) => {
      expect(typeof f.id).toBe("string");
      expect(typeof f.latitude).toBe("number");
      expect(typeof f.longitude).toBe("number");
      expect(typeof f.name).toBe("string");
      expect(typeof f.lastActive).toBe("string");
      expect(typeof f.sharingActive).toBe("boolean");
    });
  });

  it("positions each follower within 0.01 degrees of the given lat/lng", () => {
    const { result } = renderHook(() => useMockFollowers(21.0, 105.0));
    result.current.forEach((f) => {
      expect(Math.abs(f.latitude - 21.0)).toBeLessThan(0.01);
      expect(Math.abs(f.longitude - 105.0)).toBeLessThan(0.01);
    });
  });

  it("defaults to 0,0 when no lat/lng is provided", () => {
    const { result } = renderHook(() => useMockFollowers());
    result.current.forEach((f) => {
      expect(Math.abs(f.latitude)).toBeLessThan(0.01);
      expect(Math.abs(f.longitude)).toBeLessThan(0.01);
    });
  });

  it("returns the same reference when lat/lng does not change (useMemo)", () => {
    const { result, rerender } = renderHook(
      ({ lat, lng }: { lat: number; lng: number }) => useMockFollowers(lat, lng),
      { initialProps: { lat: 10, lng: 20 } },
    );
    const first = result.current;
    rerender({ lat: 10, lng: 20 });
    expect(result.current).toBe(first);
  });

  it("returns a new reference when lat/lng changes", () => {
    const { result, rerender } = renderHook(
      ({ lat, lng }: { lat: number; lng: number }) => useMockFollowers(lat, lng),
      { initialProps: { lat: 10, lng: 20 } },
    );
    const first = result.current;
    rerender({ lat: 30, lng: 40 });
    expect(result.current).not.toBe(first);
    result.current.forEach((f) => {
      expect(Math.abs(f.latitude - 30)).toBeLessThan(0.01);
    });
  });

  it("all follower IDs are unique", () => {
    const { result } = renderHook(() => useMockFollowers(0, 0));
    const ids = result.current.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates lastActive as a valid ISO date string", () => {
    const { result } = renderHook(() => useMockFollowers(0, 0));
    result.current.forEach((f) => {
      expect(() => new Date(f.lastActive).toISOString()).not.toThrow();
    });
  });
});
