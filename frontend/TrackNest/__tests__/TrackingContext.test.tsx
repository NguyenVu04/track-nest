/**
 * Use case under test:
 *  - TRACK-UC-02: Enable / Disable location sharing.
 */

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// SHARE_LOCATION_KEY and TRACKING_KEY are plain string constants — import after mocks.
import React from "react";
import { Text, Pressable, View } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TrackingProvider, useTracking } from "@/contexts/TrackingContext";
import { SHARE_LOCATION_KEY } from "@/constant";

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

// Minimal component that exercises the context API.
function Fixture() {
  const { shareLocation, setShareLocation } = useTracking();
  return (
    <View>
      <Text testID="value">{String(shareLocation)}</Text>
      <Pressable testID="enable" onPress={() => setShareLocation(true)} />
      <Pressable testID="disable" onPress={() => setShareLocation(false)} />
    </View>
  );
}

function renderWithProvider() {
  return render(
    <TrackingProvider>
      <Fixture />
    </TrackingProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

describe("TrackingContext — TRACK-UC-02", () => {
  describe("Enable location sharing", () => {
    it("persists 'true' to AsyncStorage and flips state to true", async () => {
      const { getByTestId } = renderWithProvider();

      await act(async () => {
        fireEvent.press(getByTestId("enable"));
      });

      expect(mockSetItem).toHaveBeenCalledWith(SHARE_LOCATION_KEY, "true");
      await waitFor(() =>
        expect(getByTestId("value").props.children).toBe("true"),
      );
    });
  });

  describe("Disable location sharing", () => {
    it("persists 'false' to AsyncStorage and flips state to false", async () => {
      // Pre-seed so the initial value is true.
      mockGetItem.mockResolvedValue("true");
      const { getByTestId } = renderWithProvider();

      // Wait for the async loadPreferences() effect to complete before interacting,
      // otherwise it can race and overwrite the state back to "true" after the press.
      await waitFor(() =>
        expect(getByTestId("value").props.children).toBe("true"),
      );

      await act(async () => {
        fireEvent.press(getByTestId("disable"));
      });

      expect(mockSetItem).toHaveBeenCalledWith(SHARE_LOCATION_KEY, "false");
      await waitFor(() =>
        expect(getByTestId("value").props.children).toBe("false"),
      );
    });
  });

  describe("Initial load from storage", () => {
    it("reads the stored value and initialises shareLocation to true", async () => {
      mockGetItem.mockResolvedValue("true");
      const { getByTestId } = renderWithProvider();

      await waitFor(() =>
        expect(getByTestId("value").props.children).toBe("true"),
      );
      expect(mockGetItem).toHaveBeenCalledWith(SHARE_LOCATION_KEY);
    });

    it("defaults to false when nothing is stored", async () => {
      mockGetItem.mockResolvedValue(null);
      const { getByTestId } = renderWithProvider();

      await waitFor(() =>
        expect(getByTestId("value").props.children).toBe("false"),
      );
    });
  });
});
