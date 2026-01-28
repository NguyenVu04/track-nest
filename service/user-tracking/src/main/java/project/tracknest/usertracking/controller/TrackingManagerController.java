package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.trackingmanager.service.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerController extends TrackingManagerControllerGrpc.TrackingManagerControllerImplBase {
    private final TrackingManagerService service;

    @Override
    public void createFamilyCircle(
            CreateFamilyCircleRequest request,
            StreamObserver<CreateFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        CreateFamilyCircleResponse response = service
                .createFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listFamilyCircles(
            ListFamilyCirclesRequest request,
            StreamObserver<ListFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        ListFamilyCircleResponse response = service
                .listFamilyCircles(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteFamilyCircle(
            DeleteFamilyCircleRequest request,
            StreamObserver<DeleteFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        DeleteFamilyCircleResponse response = service
                .deleteFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void updateFamilyCircle(
            UpdateFamilyCircleRequest request,
            StreamObserver<UpdateFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        UpdateFamilyCircleResponse response = service
                .updateFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void updateFamilyRole(
            UpdateFamilyRoleRequest request,
            StreamObserver<UpdateFamilyRoleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        UpdateFamilyRoleResponse response = service
                .updateFamilyRole(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void createParticipationPermission(
            CreateParticipationPermissionRequest request,
            StreamObserver<CreateParticipationPermissionResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        CreateParticipationPermissionResponse response = service
                .createParticipationPermission(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void participateInFamilyCircle(
            ParticipateInFamilyCircleRequest request,
            StreamObserver<ParticipateInFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        ParticipateInFamilyCircleResponse response = service
                .participateInFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void leaveFamilyCircle(
            LeaveFamilyCircleRequest request,
            StreamObserver<LeaveFamilyCircleResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        LeaveFamilyCircleResponse response = service
                .leaveFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void assignFamilyCircleAdmin(
            AssignFamilyCircleAdminRequest request,
            StreamObserver<AssignFamilyCircleAdminResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        AssignFamilyCircleAdminResponse response = service
                .assignFamilyCircleAdmin(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void removeMemberFromFamilyCircle(RemoveMemberFromFamilyCircleRequest request, StreamObserver<RemoveMemberFromFamilyCircleResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        RemoveMemberFromFamilyCircleResponse response = service
                .removeMemberFromFamilyCircle(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
