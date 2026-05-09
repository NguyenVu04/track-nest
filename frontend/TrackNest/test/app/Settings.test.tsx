import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import SettingsScreen from "@/app/(app)/(tabs)/settings";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English", setLanguage: jest.fn() }),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    logout: jest.fn().mockResolvedValue(undefined),
    isGuestMode: false,
  }),
}));
jest.mock("@/contexts/DevModeContext", () => ({
  useDevMode: () => ({ devMode: false, setDevMode: jest.fn() }),
}));
jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: () => ({
    profile: { userId: "u1", username: "alice", email: "alice@test.com" },
    exportUserData: jest.fn().mockResolvedValue(undefined),
    privacySettings: {},
    updatePrivacySetting: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({
    guardians: [],
    voiceSettings: { enabled: false },
    setVoiceEnabled: jest.fn(),
    checkForSOSCommand: jest.fn(),
  }),
}));
jest.mock("@/contexts/TrackingContext", () => ({
  useTracking: () => ({
    tracking: false,
    shareLocation: false,
    setShareLocation: jest.fn(),
  }),
}));
jest.mock("@/services/locationUpload", () => ({
  uploadPendingLocations: jest.fn().mockResolvedValue({ count: 0 }),
}));
jest.mock("@/services/notifier", () => ({
  unregisterMobileDevice: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils/backgroundLocation", () => ({
  requestPermissionsAndStart: jest.fn().mockResolvedValue(undefined),
  stopBackgroundLocationTracking: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils", () => ({
  getServiceUrl: jest.fn().mockResolvedValue("http://localhost"),
  getEmergencyUrl: jest.fn().mockResolvedValue("http://emergency"),
  getCriminalUrl: jest.fn().mockResolvedValue("http://criminal"),
  getGrpcUrl: jest.fn().mockResolvedValue("http://grpc"),
  showToast: jest.fn(),
  SERVICE_URL_KEY: "service_url",
  EMERGENCY_URL_KEY: "emergency_url",
  CRIMINAL_URL_KEY: "criminal_url",
  GRPC_URL_KEY: "grpc_url",
}));
jest.mock("expo-linking", () => ({
  openSettings: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/components/SettingsModals/DeveloperOptionsModal", () => ({
  DeveloperOptionsModal: () => null,
}));
jest.mock("@/components/SettingsModals/LanguageModal", () => ({
  LanguageModal: () => null,
}));
jest.mock("@/components/SettingsModals/LocationPermissionsModal", () => ({
  LocationPermissionsModal: () => null,
}));
jest.mock("@/components/SettingsModals/NotificationPermissionsModal", () => ({
  NotificationPermissionsModal: () => null,
}));
jest.mock("@/components/SettingsModals/PermissionsSummaryModal", () => ({
  PermissionsSummaryModal: () => null,
}));
jest.mock("@/components/SettingsModals/PrivacyModal", () => ({
  PrivacyModal: () => null,
}));

describe("SettingsScreen", () => {
  it("renders without crashing", async () => {
    const { unmount } = render(<SettingsScreen />);
    await waitFor(() => unmount());
  });

  it("renders the Settings heading", async () => {
    const { findAllByText } = render(<SettingsScreen />);
    const matches = await findAllByText(/settings/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders section headers and setting rows", async () => {
    const { findByText } = render(<SettingsScreen />);
    await findByText(/general/i);
    await findByText(/notifications/i);
  });

  it("renders sign-out button for authenticated user", async () => {
    const { findByText } = render(<SettingsScreen />);
    await findByText(/sign out|logout/i);
  });
});
