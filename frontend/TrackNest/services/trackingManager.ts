import fetch from "cross-fetch"; // polyfill for RN

import Constants from "expo-constants";

import {
  AssignFamilyCircleAdminRequest,
  AssignFamilyCircleAdminResponse,
  CreateFamilyCircleRequest,
  CreateFamilyCircleResponse,
  CreateParticipationPermissionRequest,
  CreateParticipationPermissionResponse,
  DeleteFamilyCircleRequest,
  DeleteFamilyCircleResponse,
  LeaveFamilyCircleRequest,
  LeaveFamilyCircleResponse,
  ListFamilyCircleResponse,
  ListFamilyCirclesRequest,
  ParticipateInFamilyCircleRequest,
  ParticipateInFamilyCircleResponse,
  RemoveMemberFromFamilyCircleRequest,
  RemoveMemberFromFamilyCircleResponse,
  UpdateFamilyCircleRequest,
  UpdateFamilyCircleResponse,
  UpdateFamilyRoleRequest,
  UpdateFamilyRoleResponse,
} from "@/proto/trackingmanager_pb";
import { TrackingManagerControllerClient } from "@/proto/TrackingmanagerServiceClientPb";

global.fetch = global.fetch || fetch;

const jwt =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiZTl1LTJpS3d6Vkd3V09XUVNRc3pGNFBaaUV1X0RoZm8zbjE5T291bVBnIn0.eyJleHAiOjE3Njc2NzA1MTgsImlhdCI6MTc2NzYzNDUxOCwianRpIjoib25ydHJvOjMwNmY2OGZhLWNhYTYtNDBlOS05MDRjLWVmZjJiN2I0YWVmNSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvdHJhY2tuZXN0LXVzZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZjhmNzM1YjQtNTQ5Yy00ZDhjLTllMTAtMTVmOGMxOThiNzFiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidHJhY2tuZXN0Iiwic2lkIjoiYmQ0N2Y5MGQtYTE3NC1kNWZkLWMwNmYtNDAyNjcyZThjZWJlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXRyYWNrbmVzdC11c2VyIiwidW1hX2F1dGhvcml6YXRpb24iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJsb2NhbGUiOiJlbiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20ifQ.YoV68NnN1wmjU7f9Si12g7zcCOe7JB_pBvRZFlcwKIH9uW1A2ce7ZpVQ6BekgpCoPLCQNZpKU0Vp2MxLSRhNERNEaMYQFcMCz6X2cUjfOJeZbwhfH8aElBoOSDmd9zMcsyayPktvLAkZ699nC0PRM8dXioW8PEWacb5ju_A1EhBvtVcqd8cMjAnr_j99V_FCggoGEuUx-ckdemon4VH2Fy4Hhn2QpLdpSBcH8mCJFvatRpMAszWEsWuXPZuQeJsH83pdq8Qtkg-lB2tDqzcIP2tP_hGZx83hxNtzggZqb17LoMAPmrlXIQzs24frr0pGln6PvIYFawGsUsmWU8fV5A";

const metadata = {
  Authorization: `Bearer ${jwt}`,
};

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return "http://localhost:8800";

  const ip = hostUri.split(":")[0];
  return `http://${ip}:8800`;
};

const client = new TrackingManagerControllerClient(getBaseUrl(), null, {
  format: "text",
});

/**
 * Creates a new family circle with the provided name and initial role.
 */
export const createFamilyCircle = async (
  name: string,
  familyRole: string,
): Promise<CreateFamilyCircleResponse.AsObject> => {
  const request = new CreateFamilyCircleRequest();
  request.setName(name);
  request.setFamilyRole(familyRole);

  console.log("Creating family circle:", name);

  try {
    const response = await client.createFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle created:", result);
    return result;
  } catch (error) {
    console.error("Failed to create family circle:", error);
    throw error;
  }
};

/**
 * Returns a paginated list of family circles visible to the caller.
 */
export const listFamilyCircles = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListFamilyCircleResponse.AsObject> => {
  const request = new ListFamilyCirclesRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  console.log("Listing family circles, page size:", pageSize);

  try {
    const response = await client.listFamilyCircles(request, metadata);
    const result = response.toObject();
    console.log("Family circles listed:", result.familyCirclesList.length);
    return result;
  } catch (error) {
    console.error("Failed to list family circles:", error);
    throw error;
  }
};

/**
 * Deletes the specified family circle.
 */
export const deleteFamilyCircle = async (
  familyCircleId: string,
): Promise<DeleteFamilyCircleResponse.AsObject> => {
  const request = new DeleteFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);

  console.log("Deleting family circle:", familyCircleId);

  try {
    const response = await client.deleteFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle deleted:", result);
    return result;
  } catch (error) {
    console.error("Failed to delete family circle:", error);
    throw error;
  }
};

/**
 * Updates mutable fields of a family circle.
 */
export const updateFamilyCircle = async (
  familyCircleId: string,
  name: string,
): Promise<UpdateFamilyCircleResponse.AsObject> => {
  const request = new UpdateFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setName(name);

  console.log("Updating family circle:", familyCircleId);

  try {
    const response = await client.updateFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle updated:", result);
    return result;
  } catch (error) {
    console.error("Failed to update family circle:", error);
    throw error;
  }
};

/**
 * Updates the caller's role within the specified family circle.
 */
export const updateFamilyRole = async (
  familyCircleId: string,
  familyRole: string,
): Promise<UpdateFamilyRoleResponse.AsObject> => {
  const request = new UpdateFamilyRoleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setFamilyRole(familyRole);

  console.log("Updating family role in circle:", familyCircleId);

  try {
    const response = await client.updateFamilyRole(request, metadata);
    const result = response.toObject();
    console.log("Family role updated:", result);
    return result;
  } catch (error) {
    console.error("Failed to update family role:", error);
    throw error;
  }
};

/**
 * Issues a time-limited OTP for joining a family circle.
 */
export const createParticipationPermission = async (
  familyCircleId: string,
  previousOtp?: string,
): Promise<CreateParticipationPermissionResponse.AsObject> => {
  const request = new CreateParticipationPermissionRequest();
  request.setFamilyCircleId(familyCircleId);
  if (previousOtp) {
    request.setPreviousOtp(previousOtp);
  }

  console.log("Creating participation permission for circle:", familyCircleId);

  try {
    const response = await client.createParticipationPermission(
      request,
      metadata,
    );
    const result = response.toObject();
    console.log("Participation permission created:", result);
    return result;
  } catch (error) {
    console.error("Failed to create participation permission:", error);
    throw error;
  }
};

/**
 * Consumes a valid OTP to join a family circle.
 */
export const participateInFamilyCircle = async (
  otp: string,
): Promise<ParticipateInFamilyCircleResponse.AsObject> => {
  const request = new ParticipateInFamilyCircleRequest();
  request.setOtp(otp);

  console.log("Joining family circle with OTP");

  try {
    const response = await client.participateInFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Joined family circle:", result);
    return result;
  } catch (error) {
    console.error("Failed to join family circle:", error);
    throw error;
  }
};

/**
 * Removes the caller from the specified family circle.
 */
export const leaveFamilyCircle = async (
  familyCircleId: string,
): Promise<LeaveFamilyCircleResponse.AsObject> => {
  const request = new LeaveFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);

  console.log("Leaving family circle:", familyCircleId);

  try {
    const response = await client.leaveFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Left family circle:", result);
    return result;
  } catch (error) {
    console.error("Failed to leave family circle:", error);
    throw error;
  }
};

/**
 * Removes a member from a family circle (admin only).
 */
export const removeMemberFromFamilyCircle = async (
  familyCircleId: string,
  memberId: string,
): Promise<RemoveMemberFromFamilyCircleResponse.AsObject> => {
  const request = new RemoveMemberFromFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);

  console.log("Removing member:", memberId, "from circle:", familyCircleId);

  try {
    const response = await client.removeMemberFromFamilyCircle(
      request,
      metadata,
    );
    const result = response.toObject();
    console.log("Member removed:", result);
    return result;
  } catch (error) {
    console.error("Failed to remove member from family circle:", error);
    throw error;
  }
};

/**
 * Grants admin privileges to a member within a family circle.
 */
export const assignFamilyCircleAdmin = async (
  familyCircleId: string,
  memberId: string,
): Promise<AssignFamilyCircleAdminResponse.AsObject> => {
  const request = new AssignFamilyCircleAdminRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);

  console.log(
    "Assigning admin to member:",
    memberId,
    "in circle:",
    familyCircleId,
  );

  try {
    const response = await client.assignFamilyCircleAdmin(request, metadata);
    const result = response.toObject();
    console.log("Admin assigned:", result);
    return result;
  } catch (error) {
    console.error("Failed to assign admin:", error);
    throw error;
  }
};
