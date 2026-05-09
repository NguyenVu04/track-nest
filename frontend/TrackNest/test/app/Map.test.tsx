import React from "react";
import { render, act } from "@testing-library/react-native";
import MapScreen from "@/app/(app)/(tabs)/map";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-maps", () => ({
  __esModule: true,
  default: () => null,
  Circle: () => null,
  Marker: () => null,
  PROVIDER_GOOGLE: "google",
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: any) => cb(),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@gorhom/bottom-sheet", () => {
  const { forwardRef } = require("react");
  return {
    BottomSheetModal: forwardRef((_p: any, _r: any) => null),
    BottomSheetBackdrop: () => null,
    BottomSheetFlatList: ({ data, renderItem }: any) => null,
  };
});
jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 70,
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  unregisterAllTasksAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-background-task", () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  BackgroundTaskResult: { Success: 1, Failed: 0 },
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { Balanced: 3, High: 4 },
  ActivityType: { Fitness: 2 },
}));
jest.mock("rn-tourguide", () => ({
  TourGuideProvider: ({ children }: any) => children,
  TourGuideZoneByPosition: ({ children }: any) => children ?? null,
  useTourGuideController: () => ({
    canStart: false,
    start: jest.fn(),
    stop: jest.fn(),
    eventEmitter: { on: jest.fn(), off: jest.fn() },
  }),
}));

// Context mocks
jest.mock("@/contexts/MapContext", () => ({
  useMapContext: jest.fn().mockReturnValue({
    selectedSafeZone: null,
    setSelectedSafeZone: jest.fn(),
    mapType: "standard",
    setMapType: jest.fn(),
  }),
}));
jest.mock("@/contexts/POIAnalyticsContext", () => ({
  usePOIAnalytics: jest.fn().mockReturnValue({
    nearbyReports: [],
    nearbyPOIs: [],
    crimeHeatmapPoints: [],
    loadCrimeHeatmap: jest.fn(),
    getPOIColor: jest.fn().mockReturnValue("#ff0000"),
    loading: false,
  }),
}));
jest.mock("@/contexts/TrackingContext", () => ({
  useTracking: jest.fn().mockReturnValue({
    myLocation: null,
    shareLocation: false,
  }),
}));

// Hook mocks
jest.mock("@/hooks/useDeviceLocation", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    location: { latitude: 10.77, longitude: 106.64 },
    loading: false,
    error: null,
  }),
}));
jest.mock("@/hooks/useFamilyCircle", () => ({
  useFamilyCircle: jest.fn().mockReturnValue({
    circles: [],
    loading: false,
    selectedCircle: null,
    setSelectedCircle: jest.fn(),
    refresh: jest.fn(),
  }),
}));
jest.mock("@/hooks/useFollowers", () => ({
  useFollowers: jest.fn().mockReturnValue({ followers: [], loading: false }),
}));
jest.mock("@/hooks/useStreamedFollowers", () => ({
  useStreamedFollowers: () => ({ followers: [], loading: false }),
}));
jest.mock("@/hooks/useAddressFromLocation", () => ({
  useAddressFromLocation: jest.fn().mockReturnValue({ address: null, loading: false }),
}));
jest.mock("@/hooks/useMapController", () => ({
  useMapController: jest.fn().mockReturnValue({
    mapRef: { current: null },
    animateToRegion: jest.fn(),
    animateToUser: jest.fn(),
  }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

// Service mocks
jest.mock("@/services/emergency", () => ({
  emergencyService: {
    getSafeZones: jest.fn().mockResolvedValue({ content: [] }),
    getNearestSafeZones: jest.fn().mockResolvedValue([]),
    getActiveEmergencyRequest: jest.fn().mockResolvedValue(null),
    createEmergencyRequest: jest.fn().mockResolvedValue({ id: "e1" }),
    cancelEmergencyRequest: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock("@/services/tracker", () => ({
  updateUserLocation: jest.fn().mockResolvedValue(undefined),
}));

// Component mocks
jest.mock("@/components/BottomSheets/FamilyCircleListSheet", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/BottomSheets/FollowerInfoSheet", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/BottomSheets/GeneralFollowerInfoSheet", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/BottomSheets/MapTypesSheet", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/BottomSheets/MyInfoSheet", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/CurrentLocationMarker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/FollowerInfo", () => ({ FollowerInfo: () => null }));
jest.mock("@/components/FollowerMarker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/Loaders/LocationLoader", () => ({
  LocationLoader: () => null,
}));
jest.mock("@/components/Loaders/MapViewLoader", () => ({
  MapViewLoader: () => null,
}));
jest.mock("@/components/MapControls", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/MapHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/constant/mockFamilyCircles", () => ({
  getMockFollowersForCircle: jest.fn().mockReturnValue([]),
}));
jest.mock("@/constant", () => ({
  OPEN_GENERAL_INFO_SHEET_EVENT: "open_general_info_sheet",
}));

describe("MapScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<MapScreen />)).not.toThrow();
  });

  it("renders with mocked location data", async () => {
    render(<MapScreen />);
    await act(async () => {});
  });

  it("renders with no location", async () => {
    const { default: useDeviceLocation } = require("@/hooks/useDeviceLocation");
    useDeviceLocation.mockReturnValue({ location: null, loading: true, error: null });
    render(<MapScreen />);
    await act(async () => {});
  });

  it("renders with followers", async () => {
    const { useFollowers } = require("@/hooks/useFollowers");
    useFollowers.mockReturnValue({
      followers: [{ id: "f1", username: "Bob", latitude: 10.77, longitude: 106.64 }],
      loading: false,
    });
    render(<MapScreen />);
    await act(async () => {});
  });
});
