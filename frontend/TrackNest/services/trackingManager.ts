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
import { getAuthMetadata, getGrpcUrl } from "@/utils";

global.fetch = global.fetch || fetch;

let _client: TrackingManagerControllerClient | null = null;

async function getClient(): Promise<TrackingManagerControllerClient> {
  if (!_client) {
    const url = await getGrpcUrl();
    _client = new TrackingManagerControllerClient(url, null, { format: "text" });
  }
  return _client;
}

export const createFamilyCircle = async (
  name: string,
  familyRole: string,
): Promise<CreateFamilyCircleResponse.AsObject> => {
  const request = new CreateFamilyCircleRequest();
  request.setName(name);
  request.setFamilyRole(familyRole);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).createFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to create family circle:", error);
    throw error;
  }
};

export const listFamilyCircles = async (
  pageSize: number,
  pageToken?: string,
): Promise<ListFamilyCircleResponse.AsObject> => {
  const request = new ListFamilyCirclesRequest();
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  const metadata = await getAuthMetadata();

  const url = await getGrpcUrl();
  console.log("Tracking Manager gRPC URL:", url);

  try {
    const response = await (
      await getClient()
    ).listFamilyCircles(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to list family circles:", error);
    throw error;
  }
};

export const deleteFamilyCircle = async (
  familyCircleId: string,
): Promise<DeleteFamilyCircleResponse.AsObject> => {
  const request = new DeleteFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).deleteFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to delete family circle:", error);
    throw error;
  }
};

export const updateFamilyCircle = async (
  familyCircleId: string,
  name: string,
): Promise<UpdateFamilyCircleResponse.AsObject> => {
  const request = new UpdateFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setName(name);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to update family circle:", error);
    throw error;
  }
};

export const listFamilyCircleMembers = async (
  familyCircleId: string,
): Promise<ListFamilyCircleMembersResponse.AsObject> => {
  const request = new ListFamilyCircleMembersRequest();
  request.setFamilyCircleId(familyCircleId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).listFamilyCircleMembers(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to list family circle members:", error);
    throw error;
  }
};

export const updateFamilyRole = async (
  familyCircleId: string,
  familyRole: string,
): Promise<UpdateFamilyRoleResponse.AsObject> => {
  const request = new UpdateFamilyRoleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setFamilyRole(familyRole);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).updateFamilyRole(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to update family role:", error);
    throw error;
  }
};

export const createParticipationPermission = async (
  familyCircleId: string,
  previousOtp?: string,
): Promise<CreateParticipationPermissionResponse.AsObject> => {
  const request = new CreateParticipationPermissionRequest();
  request.setFamilyCircleId(familyCircleId);
  if (previousOtp) {
    request.setPreviousOtp(previousOtp);
  }

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).createParticipationPermission(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to create participation permission:", error);
    throw error;
  }
};

export const participateInFamilyCircle = async (
  otp: string,
): Promise<ParticipateInFamilyCircleResponse.AsObject> => {
  const request = new ParticipateInFamilyCircleRequest();
  request.setOtp(otp);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).participateInFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to join family circle:", error);
    throw error;
  }
};

export const leaveFamilyCircle = async (
  familyCircleId: string,
): Promise<LeaveFamilyCircleResponse.AsObject> => {
  const request = new LeaveFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).leaveFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to leave family circle:", error);
    throw error;
  }
};

export const removeMemberFromFamilyCircle = async (
  familyCircleId: string,
  memberId: string,
): Promise<RemoveMemberFromFamilyCircleResponse.AsObject> => {
  const request = new RemoveMemberFromFamilyCircleRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).removeMemberFromFamilyCircle(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to remove member from family circle:", error);
    throw error;
  }
};

export const assignFamilyCircleAdmin = async (
  familyCircleId: string,
  memberId: string,
): Promise<AssignFamilyCircleAdminResponse.AsObject> => {
  const request = new AssignFamilyCircleAdminRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMemberId(memberId);

  const metadata = await getAuthMetadata();

  try {
    const response = await (
      await getClient()
    ).assignFamilyCircleAdmin(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to assign admin:", error);
    throw error;
  }
};
