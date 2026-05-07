import React from "react";
import { render } from "@testing-library/react-native";

// ─── Common mocks ─────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/utils", () => ({
  showToast: jest.fn(),
  registerBackgroundTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterBackgroundTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

// ─── notification-test mocks ──────────────────────────────────────────────────

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "ExpoToken[xxx]" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/services/notifier", () => ({
  registerMobileDevice: jest.fn().mockResolvedValue({ deviceId: "d1" }),
  unregisterMobileDevice: jest.fn().mockResolvedValue(undefined),
  updateMobileDevice: jest.fn().mockResolvedValue(undefined),
  listTrackingNotifications: jest.fn().mockResolvedValue({ notificationsList: [] }),
  listRiskNotifications: jest.fn().mockResolvedValue({ notificationsList: [] }),
  countTrackingNotifications: jest.fn().mockResolvedValue({ count: 0 }),
  countRiskNotifications: jest.fn().mockResolvedValue({ count: 0 }),
  deleteTrackingNotification: jest.fn().mockResolvedValue(undefined),
  deleteRiskNotification: jest.fn().mockResolvedValue(undefined),
  deleteTrackingNotifications: jest.fn().mockResolvedValue(undefined),
  deleteRiskNotifications: jest.fn().mockResolvedValue(undefined),
  clearTrackingNotifications: jest.fn().mockResolvedValue(undefined),
  clearRiskNotifications: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils/notifications", () => ({
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue("ExpoToken[xxx]"),
  setupNotificationChannels: jest.fn().mockResolvedValue(undefined),
}));

// ─── tracker-test mocks ───────────────────────────────────────────────────────

jest.mock("@/proto/tracker_pb", () => ({
  FamilyMemberLocation: { AsObject: {} },
}));
jest.mock("@/services/tracker", () => ({
  updateUserLocation: jest.fn().mockResolvedValue(undefined),
  listFamilyMemberLocationHistory: jest.fn().mockResolvedValue({ locationsList: [] }),
  streamFamilyMemberLocations: jest.fn().mockReturnValue({
    on: jest.fn(),
    cancel: jest.fn(),
  }),
}));
jest.mock("@/constant", () => ({
  BACKGROUND_CIRCLE_LOCATION_TASK_NAME: "bg-circle-location",
  BACKGROUND_LOCATION_UPLOAD_TASK_NAME: "bg-location-upload",
  BACKGROUND_NOTIFICATION_TASK_NAME: "bg-notification",
}));

// ─── tracking-manager-test mocks ─────────────────────────────────────────────

jest.mock("@/services/trackingManager", () => ({
  createFamilyCircle: jest.fn().mockResolvedValue({ familyCircleId: "fc1" }),
  listFamilyCircles: jest.fn().mockResolvedValue({ familyCirclesList: [] }),
  deleteFamilyCircle: jest.fn().mockResolvedValue(undefined),
  joinFamilyCircle: jest.fn().mockResolvedValue(undefined),
  leaveFamilyCircle: jest.fn().mockResolvedValue(undefined),
  listFamilyCircleMembers: jest.fn().mockResolvedValue({ membersList: [] }),
  removeMemberFromFamilyCircle: jest.fn().mockResolvedValue(undefined),
  generateFamilyCircleOTP: jest.fn().mockResolvedValue({ otp: "123456", expiresAt: 0 }),
  getMyFamilyCircleInfo: jest.fn().mockResolvedValue({}),
  streamFamilyMemberLocations: jest.fn().mockReturnValue({ on: jest.fn(), cancel: jest.fn() }),
}));

// ─── voice-test mocks ─────────────────────────────────────────────────────────

jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    start: jest.fn(),
    stop: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));
jest.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({
    checkForSOSCommand: jest.fn().mockReturnValue(false),
    voiceSettings: { enabled: false, phrase: "SOS" },
    setVoiceEnabled: jest.fn(),
  }),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("NotificationTestScreen", () => {
  it("renders without crashing", () => {
    const NotificationTestScreen = require("@/app/(app)/(tabs)/notification-test").default;
    expect(() => render(<NotificationTestScreen />)).not.toThrow();
  });

  it("renders token section", () => {
    const NotificationTestScreen = require("@/app/(app)/(tabs)/notification-test").default;
    const { UNSAFE_getAllByType } = render(<NotificationTestScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });
});

describe("NotifierTestScreen", () => {
  it("renders without crashing", () => {
    const NotifierTestScreen = require("@/app/(app)/(tabs)/notifier-test").default;
    expect(() => render(<NotifierTestScreen />)).not.toThrow();
  });

  it("renders form inputs", () => {
    const NotifierTestScreen = require("@/app/(app)/(tabs)/notifier-test").default;
    const { UNSAFE_getAllByType } = render(<NotifierTestScreen />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });
});

describe("TrackerTestScreen", () => {
  it("renders without crashing", () => {
    const TrackerTestScreen = require("@/app/(app)/(tabs)/tracker-test").default;
    expect(() => render(<TrackerTestScreen />)).not.toThrow();
  });

  it("renders stream controls", () => {
    const TrackerTestScreen = require("@/app/(app)/(tabs)/tracker-test").default;
    const { UNSAFE_getAllByType } = render(<TrackerTestScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });
});

describe("TrackingManagerTestScreen", () => {
  it("renders without crashing", () => {
    const TrackingManagerTestScreen = require("@/app/(app)/(tabs)/tracking-manager-test").default;
    expect(() => render(<TrackingManagerTestScreen />)).not.toThrow();
  });

  it("renders form inputs", () => {
    const TrackingManagerTestScreen = require("@/app/(app)/(tabs)/tracking-manager-test").default;
    const { UNSAFE_getAllByType } = render(<TrackingManagerTestScreen />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });
});

describe("VoiceTestScreen", () => {
  it("renders without crashing", () => {
    const VoiceTestScreen = require("@/app/(app)/(tabs)/voice-test").default;
    expect(() => render(<VoiceTestScreen />)).not.toThrow();
  });

  it("renders start/stop controls", () => {
    const VoiceTestScreen = require("@/app/(app)/(tabs)/voice-test").default;
    const { UNSAFE_getAllByType } = render(<VoiceTestScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });
});
