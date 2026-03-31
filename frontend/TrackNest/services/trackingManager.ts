import fetch from "cross-fetch"; // polyfill for RN

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
  ListFamilyCircleMembersRequest,
  ListFamilyCircleMembersResponse,
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
import { getAuthMetadata, getBaseUrl } from "@/utils";
import { scheduleLocalNotification } from "@/utils/notifications";

global.fetch = global.fetch || fetch;

let _client: TrackingManagerControllerClient | null = null;

async function getClient(): Promise<TrackingManagerControllerClient> {
  if (!_client) {
    const url = await getBaseUrl();
    _client = new TrackingManagerControllerClient(
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).createFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle created:", result);
    scheduleLocalNotification(
      "Circle Created",
      `"${name}" family circle has been created successfully.`,
    );
    return result;
  } catch (error) {
    console.error("Failed to create family circle:", error);
    scheduleLocalNotification(
      "Circle Creation Failed",
      `Could not create family circle "${name}".`,
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listFamilyCircles(request, metadata);
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle deleted:", result);
    scheduleLocalNotification(
      "Circle Deleted",
      "The family circle has been deleted successfully.",
    );
    return result;
  } catch (error) {
    console.error("Failed to delete family circle:", error);
    scheduleLocalNotification(
      "Delete Failed",
      "Could not delete the family circle.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Family circle updated:", result);
    scheduleLocalNotification(
      "Circle Updated",
      `Family circle has been renamed to "${name}".`,
    );
    return result;
  } catch (error) {
    console.error("Failed to update family circle:", error);
    scheduleLocalNotification(
      "Update Failed",
      "Could not update the family circle.",
    );
    throw error;
  }
};

/**
 * Retrieves members in the specified family circle.
 */
export const listFamilyCircleMembers = async (
  familyCircleId: string,
): Promise<ListFamilyCircleMembersResponse.AsObject> => {
  const request = new ListFamilyCircleMembersRequest();
  request.setFamilyCircleId(familyCircleId);

  console.log("Listing family circle members:", familyCircleId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listFamilyCircleMembers(request, metadata);
    const result = response.toObject();
    console.log("Family circle members listed:", result.membersList.length);
    return result;
  } catch (error) {
    console.error("Failed to list family circle members:", error);
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateFamilyRole(request, metadata);
    const result = response.toObject();
    console.log("Family role updated:", result);
    scheduleLocalNotification(
      "Role Updated",
      `Your role in the family circle has been updated to "${familyRole}".`,
    );
    return result;
  } catch (error) {
    console.error("Failed to update family role:", error);
    scheduleLocalNotification(
      "Role Update Failed",
      "Could not update your family role.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).createParticipationPermission(request, metadata);
    const result = response.toObject();
    console.log("Participation permission created:", result);
    scheduleLocalNotification(
      "Invite Code Ready",
      "An invite code has been generated. Share it with someone to join your circle.",
    );
    return result;
  } catch (error) {
    console.error("Failed to create participation permission:", error);
    scheduleLocalNotification(
      "Invite Failed",
      "Could not generate an invite code for the family circle.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).participateInFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Joined family circle:", result);
    scheduleLocalNotification(
      "Joined Circle",
      "You have successfully joined the family circle.",
    );
    return result;
  } catch (error) {
    console.error("Failed to join family circle:", error);
    scheduleLocalNotification(
      "Join Failed",
      "Could not join the family circle. Check your code and try again.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).leaveFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Left family circle:", result);
    scheduleLocalNotification(
      "Left Circle",
      "You have successfully left the family circle.",
    );
    return result;
  } catch (error) {
    console.error("Failed to leave family circle:", error);
    scheduleLocalNotification(
      "Leave Failed",
      "Could not leave the family circle.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).removeMemberFromFamilyCircle(request, metadata);
    const result = response.toObject();
    console.log("Member removed:", result);
    scheduleLocalNotification(
      "Member Removed",
      "The member has been removed from the family circle.",
    );
    return result;
  } catch (error) {
    console.error("Failed to remove member from family circle:", error);
    scheduleLocalNotification(
      "Removal Failed",
      "Could not remove the member from the family circle.",
    );
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

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).assignFamilyCircleAdmin(request, metadata);
    const result = response.toObject();
    console.log("Admin assigned:", result);
    scheduleLocalNotification(
      "Admin Assigned",
      "Admin privileges have been granted to the selected member.",
    );
    return result;
  } catch (error) {
    console.error("Failed to assign admin:", error);
    scheduleLocalNotification(
      "Assignment Failed",
      "Could not assign admin privileges.",
    );
    throw error;
  }
};
