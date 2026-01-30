import fetch from "cross-fetch"; // polyfill for RN

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

global.fetch = global.fetch || fetch;

const jwt =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiZTl1LTJpS3d6Vkd3V09XUVNRc3pGNFBaaUV1X0RoZm8zbjE5T291bVBnIn0.eyJleHAiOjE3Njc2NzA1MTgsImlhdCI6MTc2NzYzNDUxOCwianRpIjoib25ydHJvOjMwNmY2OGZhLWNhYTYtNDBlOS05MDRjLWVmZjJiN2I0YWVmNSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvdHJhY2tuZXN0LXVzZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZjhmNzM1YjQtNTQ5Yy00ZDhjLTllMTAtMTVmOGMxOThiNzFiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidHJhY2tuZXN0Iiwic2lkIjoiYmQ0N2Y5MGQtYTE3NC1kNWZkLWMwNmYtNDAyNjcyZThjZWJlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXRyYWNrbmVzdC11c2VyIiwidW1hX2F1dGhvcml6YXRpb24iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJsb2NhbGUiOiJlbiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20ifQ.YoV68NnN1wmjU7f9Si12g7zcCOe7JB_pBvRZFlcwKIH9uW1A2ce7ZpVQ6BekgpCoPLCQNZpKU0Vp2MxLSRhNERNEaMYQFcMCz6X2cUjfOJeZbwhfH8aElBoOSDmd9zMcsyayPktvLAkZ699nC0PRM8dXioW8PEWacb5ju_A1EhBvtVcqd8cMjAnr_j99V_FCggoGEuUx-ckdemon4VH2Fy4Hhn2QpLdpSBcH8mCJFvatRpMAszWEsWuXPZuQeJsH83pdq8Qtkg-lB2tDqzcIP2tP_hGZx83hxNtzggZqb17LoMAPmrlXIQzs24frr0pGln6PvIYFawGsUsmWU8fV5A";

const metadata = {
  Authorization: `Bearer ${jwt}`,
};

const client = new TrackerControllerClient(getBaseUrl(), null, {
  format: "text",
});

/**
 * Streams live location updates for family members in a circle.
 * Returns the stream so caller can cancel it when needed.
 */
export const streamFamilyMemberLocations = (
  familyCircleId: string,
  onData: (location: FamilyMemberLocation.AsObject) => void,
  onError?: (err: Error) => void,
  onEnd?: () => void,
): ClientReadableStream<FamilyMemberLocation> => {
  const request = new StreamFamilyMemberLocationsRequest();
  request.setFamilyCircleId(familyCircleId);

  console.log("Starting stream for family circle:", familyCircleId);

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
    const response = await client.updateUserLocation(request, metadata);
    const result = response.toObject();
    console.log("Location update response:", result);
    return result;
  } catch (error) {
    console.error("Failed to update location:", error);
    throw error;
  }
};
