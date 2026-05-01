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
import { getAuthMetadata, getGrpcUrl } from "@/utils";

global.fetch = global.fetch || fetch;

let _client: TrackerControllerClient | null = null;

async function getClient(): Promise<TrackerControllerClient> {
  if (!_client) {
    const url = await getGrpcUrl();
    _client = new TrackerControllerClient(url, null, { format: "text" });
  }
  return _client;
}

export const streamFamilyMemberLocations = async (
  familyCircleId: string,
  onData: (location: FamilyMemberLocation.AsObject) => void,
  onError?: (err: Error) => void,
  onEnd?: () => void,
): Promise<ClientReadableStream<FamilyMemberLocation>> => {
  const request = new StreamFamilyMemberLocationsRequest();
  request.setFamilyCircleId(familyCircleId);

  const metadata = await getAuthMetadata();
  const stream = (await getClient()).streamFamilyMemberLocations(
    request,
    metadata,
  );

  stream.on("data", (msg: FamilyMemberLocation) => {
    onData(msg.toObject());
  });

  stream.on("error", (err: Error) => {
    console.error("Stream error:", err);
    onError?.(err);
  });

  stream.on("end", () => {
    onEnd?.();
  });

  return stream;
};

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

  try {
    const metadata = await getAuthMetadata();
    const response = await (
      await getClient()
    ).listFamilyMemberLocationHistory(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to fetch location history:", error);
    throw error;
  }
};

export const updateUserLocation = async (
  locations: {
    latitudeDeg: number;
    longitudeDeg: number;
    accuracyMeter: number;
    velocityMps: number;
    timestampMs?: number;
  }[],
): Promise<UpdateUserLocationResponse.AsObject | null> => {
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
    return response.toObject();
  } catch (error) {
    return null;
  }
};
