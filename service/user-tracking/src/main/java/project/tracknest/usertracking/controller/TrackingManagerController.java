package project.tracknest.usertracking.controller;

import com.google.protobuf.BoolValue;
import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.trackingmanager.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.*;

import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerController extends TrackingManagerControllerGrpc.TrackingManagerControllerImplBase {
    private final TrackingManagerService service;

    @Override
    public void postConnection(ConnectionRequest request, StreamObserver<Empty> responseObserver) {
        UUID trackerId = getCurrentUserId();

        service.createConnection(trackerId, request);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTracker(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteTracker(userId, UUID.fromString(request.getValue()));
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTarget(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteTarget(userId, UUID.fromString(request.getValue()));
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void postTrackingPermission(Empty request, StreamObserver<PermissionResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        PermissionResponse permission = service.createTrackingPermission(userId);
        responseObserver.onNext(permission);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingPermission(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();
        UUID permissionId = UUID.fromString(request.getValue());

        service.deleteTrackingPermission(userId, permissionId);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void getUserTargets(Empty request, StreamObserver<TargetResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        List<TargetResponse> targets = service.retrieveUserTargets(userId);
        for (TargetResponse target : targets) {
            responseObserver.onNext(target);
        }

        responseObserver.onCompleted();
    }

    @Override
    public void getUserTrackers(Empty request, StreamObserver<TrackerResponse> responseObserver) {
        UUID userId = getCurrentUserId();
        List<TrackerResponse> trackers = service.retrieveUserTrackers(userId);
        for (TrackerResponse tracker : trackers) {
            responseObserver.onNext(tracker);
        }

        responseObserver.onCompleted();
    }

    @Override
    public void putTrackingStatus(BoolValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.updateTrackingStatus(userId, request.getValue());
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }
}
