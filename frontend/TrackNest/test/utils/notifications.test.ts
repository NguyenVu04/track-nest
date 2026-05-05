jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: "fake-fcm-token" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id-1"),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
}));
jest.mock("expo-device", () => ({
  isDevice: true,
}));

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {
  configureNotificationHandler,
  setupNotificationChannels,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  scheduleAutoDisappearNotification,
  setupCrashNotificationChannel,
  scheduleChatMessageNotification,
  scheduleUploadStatusNotification,
  setupUploadNotificationChannel,
  setupChatNotificationChannel,
} from "@/utils/notifications";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("configureNotificationHandler", () => {
  it("calls setNotificationHandler once", () => {
    configureNotificationHandler();
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });

  it("the handler suppresses alerts for chat_message type", async () => {
    configureNotificationHandler();
    const handlerArg = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];

    const chatNotification = { request: { content: { data: { type: "chat_message" } } } };
    const result = await handlerArg.handleNotification(chatNotification);
    expect(result.shouldShowAlert).toBe(false);
    expect(result.shouldShowBanner).toBe(false);
    expect(result.shouldPlaySound).toBe(false);
    expect(result.shouldSetBadge).toBe(true);
    expect(result.shouldShowList).toBe(true);
  });

  it("the handler shows alerts for non-chat notifications", async () => {
    configureNotificationHandler();
    const handlerArg = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];

    const other = { request: { content: { data: { type: "emergency" } } } };
    const result = await handlerArg.handleNotification(other);
    expect(result.shouldShowAlert).toBe(true);
    expect(result.shouldShowBanner).toBe(true);
    expect(result.shouldPlaySound).toBe(true);
  });
});

describe("setupNotificationChannels", () => {
  it("calls setNotificationChannelAsync on Android", async () => {
    jest.resetModules();
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "android" });

    await setupNotificationChannels();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
  });

  it("does not call setNotificationChannelAsync on iOS", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await setupNotificationChannels();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("registerForPushNotificationsAsync", () => {
  it("returns FCM token when permission is already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBe("fake-fcm-token");
  });

  it("requests permissions when not already granted and returns token", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBe("fake-fcm-token");
  });

  it("returns undefined when permission is denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBeUndefined();
  });

  it("returns undefined and warns when not on a physical device", async () => {
    (Device as any).isDevice = false;
    const token = await registerForPushNotificationsAsync();
    expect(token).toBeUndefined();
    (Device as any).isDevice = true;
  });
});

describe("scheduleLocalNotification", () => {
  it("schedules a notification with the given title and body", async () => {
    await scheduleLocalNotification("Alert", "Something happened");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { title: "Alert", body: "Something happened" },
        trigger: null,
      }),
    );
  });

  it("does not throw when scheduleNotificationAsync rejects", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    await expect(scheduleLocalNotification("T", "B")).resolves.not.toThrow();
  });
});

describe("scheduleAutoDisappearNotification", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("schedules and then dismisses the notification after durationMs", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-id");

    const promise = scheduleAutoDisappearNotification("Title", "Body", 500);
    await promise;

    jest.advanceTimersByTime(500);
    await Promise.resolve();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith("notif-id");
  });

  it("does not throw when scheduleNotificationAsync rejects", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await expect(scheduleAutoDisappearNotification("T", "B")).resolves.not.toThrow();
  });
});

describe("scheduleUploadStatusNotification", () => {
  it("schedules 'Location Synced' on success", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await scheduleUploadStatusNotification("success");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: "Location Synced" }),
      }),
    );
  });

  it("schedules 'Upload Skipped' on no_network", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await scheduleUploadStatusNotification("no_network");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: "Upload Skipped — No Network" }),
      }),
    );
  });

  it("schedules 'Upload Failed' on failed", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await scheduleUploadStatusNotification("failed");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: "Upload Failed" }),
      }),
    );
  });

  it("uses provided detail string as the body", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await scheduleUploadStatusNotification("success", "All good!");
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.body).toBe("All good!");
  });

  it("does not throw when scheduleNotificationAsync rejects", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await expect(scheduleUploadStatusNotification("success")).resolves.not.toThrow();
  });
});

describe("scheduleChatMessageNotification", () => {
  it("schedules a notification with sender name as title", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await scheduleChatMessageNotification("Alice", "Hey!");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: "Alice", body: "Hey!" }),
      }),
    );
  });

  it("does not throw on failure", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    await expect(scheduleChatMessageNotification("Bob", "Hi")).resolves.not.toThrow();
  });
});

describe("setupCrashNotificationChannel", () => {
  it("sets up the crash channel on Android", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "android" });

    await setupCrashNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "crash-detection",
      expect.objectContaining({ name: "Crash Detection" }),
    );
  });

  it("does nothing on iOS", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await setupCrashNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("setupUploadNotificationChannel", () => {
  it("sets up the upload channel on Android", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "android" });

    await setupUploadNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
  });

  it("does nothing on iOS", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await setupUploadNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("setupChatNotificationChannel", () => {
  it("sets up the chat channel on Android", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "android" });

    await setupChatNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "family-chat",
      expect.objectContaining({ name: "Family Chat" }),
    );
  });

  it("does nothing on iOS", async () => {
    const { Platform } = require("react-native");
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    await setupChatNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
