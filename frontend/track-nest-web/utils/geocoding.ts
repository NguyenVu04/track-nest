export interface GeocodingResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchLocations(
  query: string,
): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "5",
      addressdetails: "1",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "Accept-Language": "en,vi" } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: { display_name: string; lat: string; lon: string }) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      { headers: { "Accept-Language": "en,vi" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
