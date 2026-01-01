import { useMemo } from "react";

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
      // small random offset (~±200m)
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLon = (Math.random() - 0.5) * 0.01;
      const sharingActive = Math.random() > 0.4;
      const minutesAgo = Math.floor(
        Math.random() * (sharingActive ? 5 : 60 * 24 * 3)
      );
      const lastActive = new Date(
        Date.now() - minutesAgo * 60 * 1000
      ).toISOString();

      return {
        id: `mock-${i}`,
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
