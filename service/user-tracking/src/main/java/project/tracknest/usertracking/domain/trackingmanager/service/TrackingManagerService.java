package project.tracknest.usertracking.domain.trackingmanager.service;

import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

public interface TrackingManagerService {
   CreateFamilyCircleResponse createFamilyCircle(UUID userId, CreateFamilyCircleRequest request);

   ListFamilyCircleResponse listFamilyCircles(UUID userId, ListFamilyCirclesRequest request);

   DeleteFamilyCircleResponse deleteFamilyCircle(UUID userId, DeleteFamilyCircleRequest request);

   UpdateFamilyCircleResponse updateFamilyCircle(UUID userId, UpdateFamilyCircleRequest request);

   UpdateFamilyRoleResponse updateFamilyRole(UUID userId, UpdateFamilyRoleRequest request);

   CreateParticipationPermissionResponse createParticipationPermission(UUID userId, CreateParticipationPermissionRequest request);

   ParticipateInFamilyCircleResponse participateInFamilyCircle(UUID userId, ParticipateInFamilyCircleRequest request);

   LeaveFamilyCircleResponse leaveFamilyCircle(UUID userId, LeaveFamilyCircleRequest request);

   AssignFamilyCircleAdminResponse assignFamilyCircleAdmin(UUID userId, AssignFamilyCircleAdminRequest request);

   RemoveMemberFromFamilyCircleResponse removeMemberFromFamilyCircle(UUID userId, RemoveMemberFromFamilyCircleRequest request);

   ListFamilyCircleMembersResponse listFamilyCircleMembers(UUID userId, ListFamilyCircleMembersRequest request);
}