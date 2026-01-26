package project.tracknest.usertracking.domain.trackingmanager;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.*;

public interface TrackingManagerService {
   void createFamilyCircle(
           CreateFamilyCircleRequest request,
           StreamObserver<CreateFamilyCircleResponse> responseObserver
   );

   void listFamilyCircles(
           ListFamilyCirclesRequest request,
           StreamObserver<ListFamilyCircleResponse> responseObserver
   );

   void deleteFamilyCircle(
           DeleteFamilyCircleRequest request,
           StreamObserver<DeleteFamilyCircleResponse> responseObserver
   );

   void updateFamilyCircle(
           UpdateFamilyCircleRequest request,
           StreamObserver<UpdateFamilyCircleResponse> responseObserver
   );

   void updateFamilyRole(
           UpdateFamilyRoleRequest request, StreamObserver<UpdateFamilyRoleResponse> responseObserver
   );

   void createParticipationPermission(
           CreateParticipationPermissionRequest request,
           StreamObserver<CreateParticipationPermissionResponse> responseObserver
   );

   void participateInFamilyCircle(
           ParticipateInFamilyCircleRequest request,
           StreamObserver<ParticipateInFamilyCircleResponse> responseObserver
   );

   void leaveFamilyCircle(
           LeaveFamilyCircleRequest request,
           StreamObserver<LeaveFamilyCircleResponse> responseObserver
   );

   void assignFamilyCircleAdmin(
           AssignFamilyCircleAdminRequest request,
           StreamObserver<AssignFamilyCircleAdminResponse> responseObserver
   );
}