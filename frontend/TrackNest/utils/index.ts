import Constants from "expo-constants";

export const formatRelativeTime = (lastActive?: string | number | Date) => {
  if (!lastActive) return "";
  const d = new Date(lastActive);
  if (isNaN(d.getTime())) return String(lastActive);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const formatAddressFromLatLng = async (
  lat: number,
  lng: number,
): Promise<string> => {
  if (!lat || !lng) return "";

  try {
    const { reverseGeocodeAsync } = await import("expo-location");
    const results = await reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (results.length === 0) return "";

    const address = results[0].formattedAddress;

    return address || "";
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return "";
  }
};

export const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return "http://127.0.0.1";

  const ip = hostUri.split(":")[0];
  return `http://${ip}`;
};
