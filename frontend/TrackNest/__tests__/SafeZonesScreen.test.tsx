/**
 * Use case under test:
 *  - EMERGENCY-UC-07: Find nearby safe zones on the map.
 */

const mockRouterBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockRouterBack }),
}));

jest.mock("@/services/emergency", () => ({
  emergencyService: {
    getNearestSafeZones: jest.fn(),
  },
}));

jest.mock("@/hooks/useDeviceLocation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    title: "Safe Zones",
    subtitle: "Showing zones within {km} km",
    searchPlaceholder: "Search zones...",
    loading: "Loading...",
    empty: "No safe zones found",
    radiusWithMeters: "Radius: {meters} m",
    safeRadiusWithMeters: "Safe radius: {meters} m",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  const MockMap = ({ children, ...p }: any) => <View testID="map-view" {...p}>{children}</View>;
  return {
    __esModule: true,
    default: MockMap,
    Marker: () => null,
    Circle: () => null,
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

jest.mock("@/constant/types", () => ({}));

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SafeZonesScreen from "@/app/(app)/safe-zones";
import { emergencyService } from "@/services/emergency";
import useDeviceLocation from "@/hooks/useDeviceLocation";

const mockGetSafeZones = emergencyService.getNearestSafeZones as jest.Mock;
const mockUseDeviceLocation = useDeviceLocation as jest.Mock;

const fixtureLoc = { latitude: 10.776, longitude: 106.7 };
const fixtureZone = {
  id: "sz-1",
  name: "Central Police Station",
  latitude: 10.78,
  longitude: 106.69,
  radius: 500,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDeviceLocation.mockReturnValue({ location: fixtureLoc });
  mockGetSafeZones.mockResolvedValue([fixtureZone]);
});

describe("SafeZonesScreen — EMERGENCY-UC-07", () => {
  it("displays zone names after loading", async () => {
    const { getByText } = render(<SafeZonesScreen />);

    await waitFor(() =>
      expect(getByText("Central Police Station")).toBeTruthy(),
    );
    expect(mockGetSafeZones).toHaveBeenCalledTimes(1);
  });

  it("passes current location coordinates to the service", async () => {
    render(<SafeZonesScreen />);

    await waitFor(() => expect(mockGetSafeZones).toHaveBeenCalledTimes(1));
    expect(mockGetSafeZones).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: fixtureLoc.latitude,
        lng: fixtureLoc.longitude,
      }),
    );
  });

  it("filters the list when the search query matches the zone name", async () => {
    const { getByText, getByPlaceholderText } = render(<SafeZonesScreen />);
    await waitFor(() => expect(getByText("Central Police Station")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search zones..."), "Central");

    expect(getByText("Central Police Station")).toBeTruthy();
  });

  it("hides the zone when the search query does not match", async () => {
    const { queryByText, getByPlaceholderText, getByText } = render(
      <SafeZonesScreen />,
    );
    await waitFor(() => expect(getByText("Central Police Station")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search zones..."), "Hospital");

    expect(queryByText("Central Police Station")).toBeNull();
  });

  it("does not call the service when location is not yet available", async () => {
    mockUseDeviceLocation.mockReturnValue({ location: null });
    render(<SafeZonesScreen />);

    // Give async effects time to settle.
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGetSafeZones).not.toHaveBeenCalled();
  });
});
