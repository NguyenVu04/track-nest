import { FamilyCircle, Follower } from "./types";

export const mockFamilyCircles: FamilyCircle[] = [
  {
    familyCircleId: "fc-001",
    name: "My Family",
    createdAtMs: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    memberCount: 5,
    role: "admin",
  },
  {
    familyCircleId: "fc-002",
    name: "Work Team",
    createdAtMs: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    memberCount: 8,
    role: "member",
  },
  {
    familyCircleId: "fc-003",
    name: "Friends Group",
    createdAtMs: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    memberCount: 4,
    role: "member",
  },
];

// Deterministic pseudo-random helper so mock markers stay stable across rerenders.
const seededUnit = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  // Convert to [0, 1)
  return ((hash >>> 0) % 10000) / 10000;
};

const seededOffset = (seed: string, magnitude = 0.01) =>
  (seededUnit(seed) - 0.5) * (magnitude * 2);

// Mock followers for each family circle
// Locations are relative offsets that will be applied to user's current location
export const mockFollowersByCircle: Record<string, Follower[]> = {
  "fc-001": [
    // My Family - 5 members
    {
      id: "family-1",
      latitude: 0,
      longitude: 0,
      name: "Mom",
      avatar: undefined,
      lastActive: Date.now() - 5 * 60 * 1000, // 5 min ago
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "family-2",
      latitude: 0,
      longitude: 0,
      name: "Dad",
      avatar: undefined,
      lastActive: Date.now() - 15 * 60 * 1000, // 15 min ago
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "family-3",
      latitude: 0,
      longitude: 0,
      name: "Sister",
      avatar: undefined,
      lastActive: Date.now() - 2 * 60 * 1000, // 2 min ago
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "family-4",
      latitude: 0,
      longitude: 0,
      name: "Brother",
      avatar: undefined,
      lastActive: Date.now() - 60 * 60 * 1000, // 1 hour ago
      sharingActive: false,
      shareTracking: false,
    },
    {
      id: "family-5",
      latitude: 0,
      longitude: 0,
      name: "Grandma",
      avatar: undefined,
      lastActive: Date.now() - 30 * 60 * 1000, // 30 min ago
      sharingActive: true,
      shareTracking: true,
    },
  ],
  "fc-002": [
    // Work Team - 8 members
    {
      id: "work-1",
      latitude: 0,
      longitude: 0,
      name: "Alice (Manager)",
      avatar: undefined,
      lastActive: Date.now() - 3 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "work-2",
      latitude: 0,
      longitude: 0,
      name: "Bob",
      avatar: undefined,
      lastActive: Date.now() - 10 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "work-3",
      latitude: 0,
      longitude: 0,
      name: "Charlie",
      avatar: undefined,
      lastActive: Date.now() - 45 * 60 * 1000,
      sharingActive: false,
      shareTracking: false,
    },
    {
      id: "work-4",
      latitude: 0,
      longitude: 0,
      name: "Diana",
      avatar: undefined,
      lastActive: Date.now() - 5 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "work-5",
      latitude: 0,
      longitude: 0,
      name: "Eve",
      avatar: undefined,
      lastActive: Date.now() - 20 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "work-6",
      latitude: 0,
      longitude: 0,
      name: "Frank",
      avatar: undefined,
      lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      sharingActive: false,
      shareTracking: false,
    },
    {
      id: "work-7",
      latitude: 0,
      longitude: 0,
      name: "Grace",
      avatar: undefined,
      lastActive: Date.now() - 8 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "work-8",
      latitude: 0,
      longitude: 0,
      name: "Henry",
      avatar: undefined,
      lastActive: Date.now() - 12 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
  ],
  "fc-003": [
    // Friends Group - 4 members
    {
      id: "friend-1",
      latitude: 0,
      longitude: 0,
      name: "Jake",
      avatar: undefined,
      lastActive: Date.now() - 1 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "friend-2",
      latitude: 0,
      longitude: 0,
      name: "Lily",
      avatar: undefined,
      lastActive: Date.now() - 25 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
    {
      id: "friend-3",
      latitude: 0,
      longitude: 0,
      name: "Mike",
      avatar: undefined,
      lastActive: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      sharingActive: false,
      shareTracking: false,
    },
    {
      id: "friend-4",
      latitude: 0,
      longitude: 0,
      name: "Nina",
      avatar: undefined,
      lastActive: Date.now() - 7 * 60 * 1000,
      sharingActive: true,
      shareTracking: true,
    },
  ],
};

/**
 * Get mock followers for a family circle with locations relative to a base location
 */
export const getMockFollowersForCircle = (
  circleId: string,
  baseLatitude: number,
  baseLongitude: number,
): Follower[] => {
  const followers = mockFollowersByCircle[circleId];
  if (!followers) return [];

  // Apply deterministic offsets to create stable mock locations around base location.
  return followers.map((follower, index) => ({
    ...follower,
    latitude:
      baseLatitude +
      Math.sin(index * 1.5) * 0.008 +
      seededOffset(`${follower.id}-lat`, 0.004),
    longitude:
      baseLongitude +
      Math.cos(index * 1.5) * 0.008 +
      seededOffset(`${follower.id}-lng`, 0.004),
  }));
};
