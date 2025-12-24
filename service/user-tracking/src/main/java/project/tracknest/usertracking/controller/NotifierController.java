package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.notifier.NotifierService;
import project.tracknest.usertracking.proto.lib.*;

import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@Slf4j
@RequiredArgsConstructor
public class NotifierController extends NotifierControllerGrpc.NotifierControllerImplBase {
    private final NotifierService service;

    @Override
    public void postMobileDevice(MobileDeviceRequest request, StreamObserver<StringValue> responseObserver) {
        UUID userId = getCurrentUserId();

        String id = service.registerMobileDevice(userId, request);

        responseObserver.onNext(StringValue.of(id));
        responseObserver.onCompleted();
    }

    @Override
    public void deleteMobileDevice(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();
        UUID id = UUID.fromString(request.getValue());

        service.deleteMobileDevice(userId, id);

        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void getTrackingNotifications(Empty request, StreamObserver<TrackingNotificationResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        List<TrackingNotificationResponse> responses = service.retrieveTrackingNotifications(userId);
        responses.forEach(responseObserver::onNext);
        responseObserver.onCompleted();
    }

    @Override
    public void getRiskNotifications(Empty request, StreamObserver<RiskNotificationResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        List<RiskNotificationResponse> responses = service.retrieveRiskNotifications(userId);
        responses.forEach(responseObserver::onNext);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingNotification(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();
        UUID id = UUID.fromString(request.getValue());

        service.deleteTrackingNotification(userId, id);

        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteRiskNotification(StringValue request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();
        UUID id = UUID.fromString(request.getValue());

        service.deleteRiskNotification(userId, id);

        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingNotifications(NotificationIds ids, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteTrackingNotifications(
                userId,
                ids.getIdsList()
                        .stream()
                        .map(UUID::fromString)
                        .toList());

        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteRiskNotifications(NotificationIds ids, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteRiskNotifications(
                userId,
                ids.getIdsList()
                        .stream()
                        .map(UUID::fromString)
                        .toList());

        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteAllTrackingNotifications(Empty request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteAllTrackingNotifications(userId);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteAllRiskNotifications(Empty request, StreamObserver<Empty> responseObserver) {
        UUID userId = getCurrentUserId();

        service.deleteAllRiskNotifications(userId);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }
}
