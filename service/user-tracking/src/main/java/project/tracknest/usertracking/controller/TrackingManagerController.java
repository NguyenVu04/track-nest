package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.trackingmanager.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.*;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerController extends TrackingManagerControllerGrpc.TrackingManagerControllerImplBase {
    private final TrackingManagerService service;

    @Override
    public void createFamilyCircle(CreateFamilyCircleRequest request, StreamObserver<CreateFamilyCircleResponse> responseObserver) {
        super.createFamilyCircle(request, responseObserver);
    }

    @Override
    public void listFamilyCircles(ListFamilyCirclesRequest request, StreamObserver<ListFamilyCircleResponse> responseObserver) {
        super.listFamilyCircles(request, responseObserver);
    }

    @Override
    public void deleteFamilyCircle(DeleteFamilyCircleRequest request, StreamObserver<DeleteFamilyCircleResponse> responseObserver) {
        super.deleteFamilyCircle(request, responseObserver);
    }

    @Override
    public void updateFamilyCircle(UpdateFamilyCircleRequest request, StreamObserver<UpdateFamilyCircleResponse> responseObserver) {
        super.updateFamilyCircle(request, responseObserver);
    }

    @Override
    public void updateFamilyRole(UpdateFamilyRoleRequest request, StreamObserver<UpdateFamilyRoleResponse> responseObserver) {
        super.updateFamilyRole(request, responseObserver);
    }

    @Override
    public void createParticipationPermission(CreateParticipationPermissionRequest request, StreamObserver<CreateParticipationPermissionResponse> responseObserver) {
        super.createParticipationPermission(request, responseObserver);
    }

    @Override
    public void participateInFamilyCircle(ParticipateInFamilyCircleRequest request, StreamObserver<ParticipateInFamilyCircleResponse> responseObserver) {
        super.participateInFamilyCircle(request, responseObserver);
    }

    @Override
    public void leaveFamilyCircle(LeaveFamilyCircleRequest request, StreamObserver<LeaveFamilyCircleResponse> responseObserver) {
        super.leaveFamilyCircle(request, responseObserver);
    }

    @Override
    public void assignFamilyCircleAdmin(AssignFamilyCircleAdminRequest request, StreamObserver<AssignFamilyCircleAdminResponse> responseObserver) {
        super.assignFamilyCircleAdmin(request, responseObserver);
    }
}
