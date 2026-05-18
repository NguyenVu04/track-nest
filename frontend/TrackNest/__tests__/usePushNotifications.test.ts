/**
 * Tests for usePushNotifications hook — Task 4b
 *
 * Verifies that all EMERGENCY_REQUEST_* notification types navigate to the SOS screen,
 * including the newly added ACCEPTED, REJECTED, and CLOSED types.
 */

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let notificationResponseCallback: ((response: any) => void) | null = null;
let lastNotificationResponse: any = null;

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-fcm-token" }),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockImplementation((cb) => {
    notificationResponseCallback = cb;
    return { remove: jest.fn() };
  }),
  addPushTokenListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getLastNotificationResponseAsync: jest.fn().mockImplementation(() =>
    Promise.resolve(lastNotificationResponse),
  ),
}));

jest.mock("@/services/notifier", () => ({
  registerMobileDevice: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/utils/notifications", () => ({
  configureNotificationHandler: jest.fn(),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue("mock-fcm-token"),
}));

import { renderHook, act } from "@testing-library/react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const makeNotificationResponse = (type: string) => ({
  notification: {
    request: {
      content: {
        data: { type },
      },
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  notificationResponseCallback = null;
  lastNotificationResponse = null;
});

describe("usePushNotifications — emergency notification routing (Task 4b)", () => {
  const emergencyTypes = [
    "EMERGENCY_REQUEST_ASSIGNED",
    "EMERGENCY_REQUEST_ACCEPTED",
    "EMERGENCY_REQUEST_REJECTED",
    "EMERGENCY_REQUEST_CLOSED",
  ];

  emergencyTypes.forEach((type) => {
    it(`navigates to /(app)/sos when notification type is ${type}`, async () => {
      renderHook(() => usePushNotifications(true));

      await act(async () => {
        // Wait for async token registration
        await Promise.resolve();
      });

      // Simulate user tapping the notification
      act(() => {
        notificationResponseCallback?.(makeNotificationResponse(type));
      });

      expect(mockPush).toHaveBeenCalledWith("/(app)/sos");
    });
  });

  it("navigates to custom route when data.route is set (non-emergency)", async () => {
    renderHook(() => usePushNotifications(true));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      notificationResponseCallback?.({
        notification: {
          request: {
            content: {
              data: { type: "chat_message", route: "/(app)/(tabs)/family-chat" },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/(app)/(tabs)/family-chat");
  });

  it("handles killed-state launch for EMERGENCY_REQUEST_ACCEPTED", async () => {
    lastNotificationResponse = makeNotificationResponse("EMERGENCY_REQUEST_ACCEPTED");

    renderHook(() => usePushNotifications(true));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockPush).toHaveBeenCalledWith("/(app)/sos");
  });

  it("does not navigate when notification data is empty", async () => {
    renderHook(() => usePushNotifications(true));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      notificationResponseCallback?.({
        notification: { request: { content: { data: {} } } },
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
