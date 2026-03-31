import { useMemo } from "react";

const mockBaseTimeMs = Date.now();

const seededUnit = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return ((hash >>> 0) % 10000) / 10000;
};

const seededOffset = (seed: string, magnitude = 0.01) =>
  (seededUnit(seed) - 0.5) * (magnitude * 2);

export function useMockFollowers(lat?: number, lng?: number) {
  const mockFollowers = useMemo(() => {
    const names = [
      "Alex Chen",
      "Maya Nguyen",
      "Samir Patel",
      "Linh Tran",
      "Diego Martinez",
      "Omar Aziz",
    ];

    return names.map((name, i) => {
      const id = `mock-${i}`;
      // Stable mock attributes to avoid marker rerender churn from random values.
      const offsetLat = seededOffset(`${id}-lat`, 0.005);
      const offsetLon = seededOffset(`${id}-lng`, 0.005);
      const sharingActive = seededUnit(`${id}-active`) > 0.4;
      const minutesAgo = Math.floor(
        seededUnit(`${id}-last-active`) * (sharingActive ? 5 : 60 * 24 * 3),
      );
      const lastActive = new Date(
        mockBaseTimeMs - minutesAgo * 60 * 1000,
      ).toISOString();

      return {
        id,
        latitude: (lat || 0) + offsetLat,
        longitude: (lng || 0) + offsetLon,
        avatar: `@/assets/images/150-${i}.jpeg`,
        name,
        lastActive,
        sharingActive,
      };
    });
  }, [lat, lng]);

  return mockFollowers;
}
