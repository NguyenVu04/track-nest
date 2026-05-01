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
import { getAuthMetadata, getGrpcUrl } from "@/utils";

global.fetch = global.fetch || fetch;

let _client: NotifierControllerClient | null = null;

async function getClient(): Promise<NotifierControllerClient> {
  if (!_client) {
    const url = await getGrpcUrl();
    _client = new NotifierControllerClient(url, null, { format: "text" });
  }
  return _client;
}

export const registerMobileDevice = async (
  deviceToken: string,
  platform: string,
  languageCode: string,
): Promise<RegisterMobileDeviceResponse.AsObject> => {
  const request = new RegisterMobileDeviceRequest();
  request.setDevicetoken(deviceToken);
  request.setPlatform(platform);
  request.setLanguagecode(languageCode);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).registerMobileDevice(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to register mobile device:", error);
    throw error;
  }
};

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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateMobileDevice(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to update mobile device:", error);
    throw error;
  }
};

export const unregisterMobileDevice = async (
  id: string,
): Promise<UnregisterMobileDeviceResponse.AsObject> => {
  const request = new UnregisterMobileDeviceRequest();
  request.setId(id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).unregisterMobileDevice(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to unregister mobile device:", error);
    throw error;
  }
};

export const listTrackingNotifications = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListTrackingNotificationsResponse.AsObject> => {
  const request = new ListTrackingNotificationsRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listTrackingNotifications(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to list tracking notifications:", error);
    throw error;
  }
};

export const deleteTrackingNotification = async (
  id: string,
): Promise<DeleteTrackingNotificationResponse.AsObject> => {
  const request = new DeleteTrackingNotificationRequest();
  request.setId(id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteTrackingNotification(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to delete tracking notification:", error);
    throw error;
  }
};

export const deleteTrackingNotifications = async (
  ids: string[],
): Promise<DeleteTrackingNotificationsResponse.AsObject> => {
  const request = new DeleteTrackingNotificationsRequest();
  request.setIdsList(ids);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteTrackingNotifications(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to delete tracking notifications:", error);
    throw error;
  }
};

export const clearTrackingNotifications =
  async (): Promise<ClearTrackingNotificationsResponse.AsObject> => {
    const request = new ClearTrackingNotificationsRequest();

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).clearTrackingNotifications(request, metadata);
      return response.toObject();
    } catch (error) {
      console.error("Failed to clear tracking notifications:", error);
      throw error;
    }
  };

export const countTrackingNotifications =
  async (): Promise<CountTrackingNotificationsResponse.AsObject> => {
    const request = new CountTrackingNotificationsRequest();

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).countTrackingNotifications(request, metadata);
      return response.toObject();
    } catch (error) {
      console.error("Failed to count tracking notifications:", error);
      throw error;
    }
  };

export const listRiskNotifications = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListRiskNotificationsResponse.AsObject> => {
  const request = new ListRiskNotificationsRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listRiskNotifications(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to list risk notifications:", error);
    throw error;
  }
};

export const deleteRiskNotification = async (
  id: string,
): Promise<DeleteRiskNotificationResponse.AsObject> => {
  const request = new DeleteRiskNotificationRequest();
  request.setId(id);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteRiskNotification(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to delete risk notification:", error);
    throw error;
  }
};

export const deleteRiskNotifications = async (
  ids: string[],
): Promise<DeleteRiskNotificationsResponse.AsObject> => {
  const request = new DeleteRiskNotificationsRequest();
  request.setIdsList(ids);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteRiskNotifications(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to delete risk notifications:", error);
    throw error;
  }
};

export const clearRiskNotifications =
  async (): Promise<ClearRiskNotificationsResponse.AsObject> => {
    const request = new ClearRiskNotificationsRequest();

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).clearRiskNotifications(request, metadata);
      return response.toObject();
    } catch (error) {
      console.error("Failed to clear risk notifications:", error);
      throw error;
    }
  };

export const countRiskNotifications =
  async (): Promise<CountRiskNotificationsResponse.AsObject> => {
    const request = new CountRiskNotificationsRequest();

    const metadata = await getAuthMetadata();

    try {
      const response = await (
        await getClient()
      ).countRiskNotifications(request, metadata);
      return response.toObject();
    } catch (error) {
      console.error("Failed to count risk notifications:", error);
      throw error;
    }
  };
