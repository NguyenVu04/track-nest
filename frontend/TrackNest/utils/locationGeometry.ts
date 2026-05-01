export const STAY_RADIUS_METERS = 100;
export const POOR_ACCURACY_THRESHOLD_METERS = 50;

type GeoPoint = { latitude: number; longitude: number };

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isSamePlace(a: GeoPoint, b: GeoPoint): boolean {
  return distanceMeters(a, b) <= STAY_RADIUS_METERS;
}

export function isPoorAccuracy(accuracy: number): boolean {
  return accuracy > POOR_ACCURACY_THRESHOLD_METERS;
}
