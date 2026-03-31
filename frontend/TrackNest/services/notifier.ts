import fetch from "cross-fetch"; // polyfill for RN

import {
  ClearRiskNotificationsRequest,
  ClearRiskNotificationsResponse,
  ClearTrackingNotificationsRequest,
  ClearTrackingNotificationsResponse,
  CountRiskNotificationsRequest,
  CountRiskNotificationsResponse,
  CountTrackingNotificationsRequest,
  CountTrackingNotificationsResponse,
  DeleteRiskNotificationRequest,
  DeleteRiskNotificationResponse,
  DeleteRiskNotificationsRequest,
  DeleteRiskNotificationsResponse,
  DeleteTrackingNotificationRequest,
  DeleteTrackingNotificationResponse,
  DeleteTrackingNotificationsRequest,
  DeleteTrackingNotificationsResponse,
  ListRiskNotificationsRequest,
  ListRiskNotificationsResponse,
  ListTrackingNotificationsRequest,
  ListTrackingNotificationsResponse,
  RegisterMobileDeviceRequest,
  RegisterMobileDeviceResponse,
  UnregisterMobileDeviceRequest,
  UnregisterMobileDeviceResponse,
  UpdateMobileDeviceRequest,
  UpdateMobileDeviceResponse,
} from "@/proto/notifier_pb";
import { NotifierControllerClient } from "@/proto/NotifierServiceClientPb";
import { getAuthMetadata, getBaseUrl } from "@/utils";
import { scheduleLocalNotification } from "@/utils/notifications";

global.fetch = global.fetch || fetch;

let _client: NotifierControllerClient | null = null;

async function getClient(): Promise<NotifierControllerClient> {
  if (!_client) {
    const url = await getBaseUrl();
    _client = new NotifierControllerClient(
      `${url}${__DEV__ ? ":8800" : "/grpc"}`,
      null,
      {
        format: "text",
      },
    );
  }
  return _client;
}

/**
 * Registers a mobile device token for push notifications.
 */
export const registerMobileDevice = async (
  deviceToken: string,
  platform: string,
  languageCode: string,
): Promise<RegisterMobileDeviceResponse.AsObject> => {
  const request = new RegisterMobileDeviceRequest();
  request.setDevicetoken(deviceToken);
  request.setPlatform(platform);
  request.setLanguagecode(languageCode);

  console.log("Registering mobile device, platform:", platform);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).registerMobileDevice(request, metadata);
    const result = response.toObject();
    console.log("Mobile device registered:", result);
    return result;
  } catch (error) {
    console.error("Failed to register mobile device:", error);
    scheduleLocalNotification(
      "Registration Failed",
      "Could not register your device for push notifications.",
    );
    throw error;
  }
};

/**
 * Updates an existing mobile device registration by id.
 */
export const updateMobileDevice = async (
  id: string,
  deviceToken: string,
  platform: string,
  languageCode: string,
): Promise<UpdateMobileDeviceResponse.AsObject> => {
  const request = new UpdateMobileDeviceRequest();
  request.setId(id);
  request.setDevicetoken(deviceToken);
  request.setPlatform(platform);
  request.setLanguagecode(languageCode);

  console.log("Updating mobile device:", id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateMobileDevice(request, metadata);
    const result = response.toObject();
    console.log("Mobile device updated:", result);
    scheduleLocalNotification(
      "Notification Settings Updated",
      "Your device notification settings have been updated.",
    );
    return result;
  } catch (error) {
    console.error("Failed to update mobile device:", error);
    scheduleLocalNotification(
      "Update Failed",
      "Could not update device notification settings.",
    );
    throw error;
  }
};

/**
 * Unregisters a previously registered mobile device by id.
 */
export const unregisterMobileDevice = async (
  id: string,
): Promise<UnregisterMobileDeviceResponse.AsObject> => {
  const request = new UnregisterMobileDeviceRequest();
  request.setId(id);

  console.log("Unregistering mobile device:", id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).unregisterMobileDevice(request, metadata);
    const result = response.toObject();
    console.log("Mobile device unregistered:", result);
    scheduleLocalNotification(
      "Notifications Disabled",
      "Your device has been unregistered from push notifications.",
    );
    return result;
  } catch (error) {
    console.error("Failed to unregister mobile device:", error);
    scheduleLocalNotification(
      "Unregistration Failed",
      "Could not unregister your device from push notifications.",
    );
    throw error;
  }
};

/**
 * Lists tracking notifications for the current user with pagination.
 */
export const listTrackingNotifications = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListTrackingNotificationsResponse.AsObject> => {
  const request = new ListTrackingNotificationsRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  console.log("Listing tracking notifications, page size:", pageSize);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listTrackingNotifications(request, metadata);
    const result = response.toObject();
    console.log(
      "Tracking notifications listed:",
      result.trackingNotificationsList.length,
    );
    return result;
  } catch (error) {
    console.error("Failed to list tracking notifications:", error);
    throw error;
  }
};

/**
 * Deletes a single tracking notification by id.
 */
export const deleteTrackingNotification = async (
  id: string,
): Promise<DeleteTrackingNotificationResponse.AsObject> => {
  const request = new DeleteTrackingNotificationRequest();
  request.setId(id);

  console.log("Deleting tracking notification:", id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteTrackingNotification(request, metadata);
    const result = response.toObject();
    console.log("Tracking notification deleted:", result);
    scheduleLocalNotification(
      "Notification Deleted",
      "The tracking notification has been removed.",
    );
    return result;
  } catch (error) {
    console.error("Failed to delete tracking notification:", error);
    scheduleLocalNotification(
      "Delete Failed",
      "Could not delete the tracking notification.",
    );
    throw error;
  }
};

/**
 * Deletes multiple tracking notifications by ids.
 */
export const deleteTrackingNotifications = async (
  ids: string[],
): Promise<DeleteTrackingNotificationsResponse.AsObject> => {
  const request = new DeleteTrackingNotificationsRequest();
  request.setIdsList(ids);

  console.log("Deleting tracking notifications:", ids.length);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteTrackingNotifications(request, metadata);
    const result = response.toObject();
    console.log("Tracking notifications deleted:", result);
    scheduleLocalNotification(
      "Notifications Deleted",
      `${ids.length} tracking notification(s) have been removed.`,
    );
    return result;
  } catch (error) {
    console.error("Failed to delete tracking notifications:", error);
    scheduleLocalNotification(
      "Delete Failed",
      "Could not delete the selected tracking notifications.",
    );
    throw error;
  }
};

/**
 * Clears all tracking notifications for the current user.
 */
export const clearTrackingNotifications =
  async (): Promise<ClearTrackingNotificationsResponse.AsObject> => {
    const request = new ClearTrackingNotificationsRequest();

    console.log("Clearing all tracking notifications");

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).clearTrackingNotifications(request, metadata);
      const result = response.toObject();
      console.log("Tracking notifications cleared:", result);
      scheduleLocalNotification(
        "Notifications Cleared",
        "All tracking notifications have been cleared.",
      );
      return result;
    } catch (error) {
      console.error("Failed to clear tracking notifications:", error);
      scheduleLocalNotification(
        "Clear Failed",
        "Could not clear tracking notifications.",
      );
      throw error;
    }
  };

/**
 * Counts the total number of tracking notifications for the current user.
 */
export const countTrackingNotifications =
  async (): Promise<CountTrackingNotificationsResponse.AsObject> => {
    const request = new CountTrackingNotificationsRequest();

    console.log("Counting tracking notifications");

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).countTrackingNotifications(request, metadata);
      const result = response.toObject();
      console.log("Tracking notifications count:", result.totalCount);
      return result;
    } catch (error) {
      console.error("Failed to count tracking notifications:", error);
      throw error;
    }
  };

/**
 * Lists risk notifications for the current user with pagination.
 */
export const listRiskNotifications = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListRiskNotificationsResponse.AsObject> => {
  const request = new ListRiskNotificationsRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  console.log("Listing risk notifications, page size:", pageSize);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listRiskNotifications(request, metadata);
    const result = response.toObject();
    console.log(
      "Risk notifications listed:",
      result.riskNotificationsList.length,
    );
    return result;
  } catch (error) {
    console.error("Failed to list risk notifications:", error);
    throw error;
  }
};

/**
 * Deletes a single risk notification by id.
 */
export const deleteRiskNotification = async (
  id: string,
): Promise<DeleteRiskNotificationResponse.AsObject> => {
  const request = new DeleteRiskNotificationRequest();
  request.setId(id);

  console.log("Deleting risk notification:", id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteRiskNotification(request, metadata);
    const result = response.toObject();
    console.log("Risk notification deleted:", result);
    scheduleLocalNotification(
      "Notification Deleted",
      "The risk notification has been removed.",
    );
    return result;
  } catch (error) {
    console.error("Failed to delete risk notification:", error);
    scheduleLocalNotification(
      "Delete Failed",
      "Could not delete the risk notification.",
    );
    throw error;
  }
};

/**
 * Deletes multiple risk notifications by ids.
 */
export const deleteRiskNotifications = async (
  ids: string[],
): Promise<DeleteRiskNotificationsResponse.AsObject> => {
  const request = new DeleteRiskNotificationsRequest();
  request.setIdsList(ids);

  console.log("Deleting risk notifications:", ids.length);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteRiskNotifications(request, metadata);
    const result = response.toObject();
    console.log("Risk notifications deleted:", result);
    scheduleLocalNotification(
      "Notifications Deleted",
      `${ids.length} risk notification(s) have been removed.`,
    );
    return result;
  } catch (error) {
    console.error("Failed to delete risk notifications:", error);
    scheduleLocalNotification(
      "Delete Failed",
      "Could not delete the selected risk notifications.",
    );
    throw error;
  }
};

/**
 * Clears all risk notifications for the current user.
 */
export const clearRiskNotifications =
  async (): Promise<ClearRiskNotificationsResponse.AsObject> => {
    const request = new ClearRiskNotificationsRequest();

    console.log("Clearing all risk notifications");

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).clearRiskNotifications(request, metadata);
      const result = response.toObject();
      console.log("Risk notifications cleared:", result);
      scheduleLocalNotification(
        "Notifications Cleared",
        "All risk notifications have been cleared.",
      );
      return result;
    } catch (error) {
      console.error("Failed to clear risk notifications:", error);
      scheduleLocalNotification(
        "Clear Failed",
        "Could not clear risk notifications.",
      );
      throw error;
    }
  };

/**
 * Counts the total number of risk notifications for the current user.
 */
export const countRiskNotifications =
  async (): Promise<CountRiskNotificationsResponse.AsObject> => {
    const request = new CountRiskNotificationsRequest();

    console.log("Counting risk notifications");

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).countRiskNotifications(request, metadata);
      const result = response.toObject();
      console.log("Risk notifications count:", result.totalCount);
      return result;
    } catch (error) {
      console.error("Failed to count risk notifications:", error);
      throw error;
    }
  };
