import fetch from "cross-fetch"; // polyfill for RN

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ClientReadableStream } from "grpc-web";

import {
  FamilyMemberLocation,
  ListFamilyMemberLocationHistoryRequest,
  ListFamilyMemberLocationHistoryResponse,
  StreamFamilyMemberLocationsRequest,
  UpdateUserLocationRequest,
  UpdateUserLocationResponse,
} from "@/proto/tracker_pb";
import { TrackerControllerClient } from "@/proto/TrackerServiceClientPb";
import { getBaseUrl } from "@/utils";
import { StoredTokens } from "@/contexts/AuthContext";

global.fetch = global.fetch || fetch;

const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

/**
 * Retrieves the access token from device storage.
 * Returns the authorization metadata object for gRPC calls.
 */
const getAuthMetadata = async (): Promise<{ Authorization: string }> => {
  const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokensJson) {
    throw new Error("No authentication token found. Please log in.");
  }
  const tokens: StoredTokens = JSON.parse(tokensJson);
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
};

const baseUrl = getBaseUrl();

const client = new TrackerControllerClient(`${baseUrl}:8800`, null, {
  format: "text",
});

/**
 * Streams live location updates for family members in a circle.
 * Returns a promise that resolves to the stream so caller can cancel it when needed.
 */
export const streamFamilyMemberLocations = async (
  familyCircleId: string,
  onData: (location: FamilyMemberLocation.AsObject) => void,
  onError?: (err: Error) => void,
  onEnd?: () => void,
): Promise<ClientReadableStream<FamilyMemberLocation>> => {
  const request = new StreamFamilyMemberLocationsRequest();
  request.setFamilyCircleId(familyCircleId);

  console.log("Starting stream for family circle:", familyCircleId);

  const metadata = await getAuthMetadata();
  const stream = client.streamFamilyMemberLocations(request, metadata);

  stream.on("data", (msg: FamilyMemberLocation) => {
    const location = msg.toObject();
    console.log("Received family member location:", location);
    onData(location);
  });

  stream.on("error", (err: Error) => {
    console.error("Stream error:", err);
    onError?.(err);
  });

  stream.on("end", () => {
    console.log("Stream ended");
    onEnd?.();
  });

  return stream;
};

/**
 * Fetches location history for a specific family member.
 * Supports optional spatial filtering by center point and radius.
 */
export const listFamilyMemberLocationHistory = async (
  familyCircleId: string,
  memberId: string,
  memberUsername: string,
  options?: {
    memberAvatarUrl?: string;
    centerLatitudeDeg?: number;
    centerLongitudeDeg?: number;
    radiusMeter?: number;
  },
): Promise<ListFamilyMemberLocationHistoryResponse.AsObject> => {
  const request = new ListFamilyMemberLocationHistoryRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);
  request.setMemberUsername(memberUsername);

  if (options?.memberAvatarUrl) {
    request.setMemberAvatarUrl(options.memberAvatarUrl);
  }
  if (options?.centerLatitudeDeg !== undefined) {
    request.setCenterLatitudeDeg(options.centerLatitudeDeg);
  }
  if (options?.centerLongitudeDeg !== undefined) {
    request.setCenterLongitudeDeg(options.centerLongitudeDeg);
  }
  if (options?.radiusMeter !== undefined) {
    request.setRadiusMeter(options.radiusMeter);
  }

  console.log("Fetching location history for member:", memberId);

  try {
    const metadata = await getAuthMetadata();
    const response = await client.listFamilyMemberLocationHistory(
      request,
      metadata,
    );
    const result = response.toObject();
    console.log(
      "Location history received:",
      result.locationsList.length,
      "locations",
    );
    return result;
  } catch (error) {
    console.error("Failed to fetch location history:", error);
    throw error;
  }
};

/**
 * Updates the current user's location.
 */
export const updateUserLocation = async (
  latitudeDeg: number,
  longitudeDeg: number,
  accuracyMeter: number,
  velocityMps: number,
  timestampMs?: number,
): Promise<UpdateUserLocationResponse.AsObject> => {
  const request = new UpdateUserLocationRequest();
  request.setLatitudeDeg(latitudeDeg);
  request.setLongitudeDeg(longitudeDeg);
  request.setAccuracyMeter(accuracyMeter);
  request.setVelocityMps(velocityMps);
  request.setTimestampMs(timestampMs ?? Date.now());

  console.log("Updating user location:", { latitudeDeg, longitudeDeg });

  try {
    const metadata = await getAuthMetadata();
    const response = await client.updateUserLocation(request, metadata);
    const result = response.toObject();
    console.log("Location update response:", result);
    return result;
  } catch (error) {
    console.error("Failed to update location:", error);
    throw error;
  }
};
