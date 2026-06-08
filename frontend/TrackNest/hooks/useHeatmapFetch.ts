import { usePOIAnalytics } from "@/contexts/POIAnalyticsContext";
import { useEffect, useRef } from "react";
import { Region } from "react-native-maps";

/**
 * Refetch when the region center has shifted by more than this fraction of the
 * current visible span. 0.25 means >25% of the current viewport width/height.
 *
 * Adaptive behaviour:
 *   - Zoomed in  → small span → tight threshold → responsive to panning
 *   - Zoomed out → large span → loose threshold → avoids fetches on minor pans
 */
const REFETCH_FRACTION = 0.25;

/** Clamp the computed radius so queries stay usable regardless of zoom. */
const MIN_RADIUS_M = 1_000;
const MAX_RADIUS_M = 15_000;

function shouldRefetch(
  prev: { lat: number; lng: number } | null,
  region: Region,
): boolean {
  if (!prev) return true;
  return (
    Math.abs(prev.lat - region.latitude) > region.latitudeDelta * REFETCH_FRACTION ||
    Math.abs(prev.lng - region.longitude) > region.longitudeDelta * REFETCH_FRACTION
  );
}

/** Half-diagonal of the visible region in metres, clamped to a usable range. */
function computeRadius(region: Region): number {
  const latHalfM = (region.latitudeDelta / 2) * 111_000;
  const lngHalfM =
    (region.longitudeDelta / 2) *
    111_000 *
    Math.cos(region.latitude * (Math.PI / 180));
  const halfDiagM = Math.sqrt(latHalfM ** 2 + lngHalfM ** 2);
  return Math.min(Math.max(halfDiagM, MIN_RADIUS_M), MAX_RADIUS_M);
}

/**
 * Manages the crime heatmap data lifecycle, driven by the visible map region:
 * - Fetches when heatmap is enabled and a visible region is known.
 * - Skips re-fetch when the region center hasn't moved past REFETCH_FRACTION
 *   of the current viewport — prevents excessive calls on minor pans.
 * - Radius is derived from the region span so far-out zooms request more data.
 * - Clears stale data immediately when heatmap is toggled off.
 */
export function useHeatmapFetch(
  showHeatmap: boolean,
  visibleRegion: Region | null,
) {
  const { loadCrimeHeatmap, clearCrimeHeatmap } = usePOIAnalytics();
  const lastFetchRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!showHeatmap) {
      clearCrimeHeatmap();
      lastFetchRef.current = null;
      return;
    }

    if (!visibleRegion) return;

    if (!shouldRefetch(lastFetchRef.current, visibleRegion)) return;

    lastFetchRef.current = {
      lat: visibleRegion.latitude,
      lng: visibleRegion.longitude,
    };
    loadCrimeHeatmap(
      visibleRegion.latitude,
      visibleRegion.longitude,
      computeRadius(visibleRegion),
    );
  }, [showHeatmap, visibleRegion, loadCrimeHeatmap, clearCrimeHeatmap]);
}
