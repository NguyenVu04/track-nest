import fetch from "cross-fetch"; // polyfill for RN

import type { ClientReadableStream } from "grpc-web";

import {
  FamilyMemberLocation,
  ListFamilyMemberLocationHistoryRequest,
  ListFamilyMemberLocationHistoryResponse,
  StreamFamilyMemberLocationsRequest,
  UpdateUserLocationRequest,
  UpdateUserLocationResponse,
  UserLocation,
} from "@/proto/tracker_pb";
import { TrackerControllerClient } from "@/proto/TrackerServiceClientPb";
import { getAuthMetadata, getBaseUrl } from "@/utils";
import { scheduleLocalNotification } from "@/utils/notifications";

global.fetch = global.fetch || fetch;

let _client: TrackerControllerClient | null = null;

async function getClient(): Promise<TrackerControllerClient> {
  if (!_client) {
    const url = await getBaseUrl();

    console.log(
      "Creating TrackerControllerClient with URL:",
      `${url}${__DEV__ ? ":8800" : "/grpc"}`,
    );

    _client = new TrackerControllerClient(
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
  const stream = (await getClient()).streamFamilyMemberLocations(
    request,
    metadata,
  );

  stream.on("data", (msg: FamilyMemberLocation) => {
    const location = msg.toObject();
    console.log("Received family member location:", location);
    onData(location);
  });

  stream.on("error", (err: Error) => {
    scheduleLocalNotification(
      "Streaming Error",
      `Location stream error: ${err.message}`,
    );
    console.error("Stream error:", err);
    onError?.(err);
  });

  stream.on("end", () => {
    console.log("Stream ended");
    onEnd?.();
  });

  scheduleLocalNotification(
    "Location Streaming Started",
    "Live family member locations are now being streamed.",
  );
  return stream;
};

/**
 * Fetches location history for a specific family member.
 * Supports optional spatial filtering by center point and radius.
 */
export const listFamilyMemberLocationHistory = async (
  familyCircleId: string,
  memberId: string,
  options?: {
    centerLatitudeDeg?: number;
    centerLongitudeDeg?: number;
    radiusMeter?: number;
  },
): Promise<ListFamilyMemberLocationHistoryResponse.AsObject> => {
  const request = new ListFamilyMemberLocationHistoryRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);

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
    const response = await (
      await getClient()
    ).listFamilyMemberLocationHistory(request, metadata);
    const result = response.toObject();
    console.log(
      "Location history received:",
      result.locationsList.length,
      "locations",
    );
    scheduleLocalNotification(
      "Location History",
      `Retrieved ${result.locationsList.length} location point(s) for ${memberId}.`,
    );
    return result;
  } catch (error) {
    console.error("Failed to fetch location history:", error);
    scheduleLocalNotification(
      "History Failed",
      `Could not fetch location history for ${memberId}.`,
    );
    throw error;
  }
};

/**
 * Updates the current user's location.
 */
export const updateUserLocation = async (
  locations: {
    latitudeDeg: number;
    longitudeDeg: number;
    accuracyMeter: number;
    velocityMps: number;
    timestampMs?: number;
  }[],
): Promise<UpdateUserLocationResponse.AsObject> => {
  const request = new UpdateUserLocationRequest();

  const userLocations = locations.map((loc) => {
    const userLocation = new UserLocation();
    userLocation.setLatitudeDeg(loc.latitudeDeg);
    userLocation.setLongitudeDeg(loc.longitudeDeg);
    userLocation.setAccuracyMeter(loc.accuracyMeter);
    userLocation.setVelocityMps(loc.velocityMps);
    userLocation.setTimestampMs(loc.timestampMs ?? Date.now());
    return userLocation;
  });

  request.setLocationsList(userLocations);

  try {
    const metadata = await getAuthMetadata();
    const response = await (
      await getClient()
    ).updateUserLocation(request, metadata);
    const result = response.toObject();
    console.log("Location update response:", result);
    return result;
  } catch (error) {
    console.error("Failed to update location:", error);
    throw error;
  }
};
