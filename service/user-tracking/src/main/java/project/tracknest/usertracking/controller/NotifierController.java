package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.configuration.security.SecurityUtils;
import project.tracknest.usertracking.domain.notifier.service.NotifierService;
import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@Slf4j
@RequiredArgsConstructor
public class NotifierController extends NotifierControllerGrpc.NotifierControllerImplBase {
    private final NotifierService service;

    @Override
    public void registerMobileDevice(RegisterMobileDeviceRequest request, StreamObserver<RegisterMobileDeviceResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        RegisterMobileDeviceResponse response = service.registerMobileDevice(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void unregisterMobileDevice(UnregisterMobileDeviceRequest request, StreamObserver<UnregisterMobileDeviceResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        UnregisterMobileDeviceResponse response = service.unregisterMobileDevice(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listTrackingNotifications(ListTrackingNotificationsRequest request, StreamObserver<ListTrackingNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        ListTrackingNotificationsResponse response = service.listTrackingNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listRiskNotifications(ListRiskNotificationsRequest request, StreamObserver<ListRiskNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        ListRiskNotificationsResponse response = service.listRiskNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingNotification(DeleteTrackingNotificationRequest request, StreamObserver<DeleteTrackingNotificationResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        DeleteTrackingNotificationResponse response = service.deleteTrackingNotification(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteRiskNotification(DeleteRiskNotificationRequest request, StreamObserver<DeleteRiskNotificationResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        DeleteRiskNotificationResponse response = service.deleteRiskNotification(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingNotifications(DeleteTrackingNotificationsRequest request, StreamObserver<DeleteTrackingNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        DeleteTrackingNotificationsResponse response = service.deleteTrackingNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void deleteRiskNotifications(DeleteRiskNotificationsRequest request, StreamObserver<DeleteRiskNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        DeleteRiskNotificationsResponse response = service.deleteRiskNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void clearTrackingNotifications(ClearTrackingNotificationsRequest request, StreamObserver<ClearTrackingNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        ClearTrackingNotificationsResponse response = service.clearTrackingNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void clearRiskNotifications(ClearRiskNotificationsRequest request, StreamObserver<ClearRiskNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        ClearRiskNotificationsResponse response = service.clearRiskNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void countTrackingNotifications(CountTrackingNotificationsRequest request, StreamObserver<CountTrackingNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        CountTrackingNotificationsResponse response = service.countTrackingNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void countRiskNotifications(CountRiskNotificationsRequest request, StreamObserver<CountRiskNotificationsResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        CountRiskNotificationsResponse response = service.countRiskNotifications(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void updateMobileDevice(UpdateMobileDeviceRequest request, StreamObserver<UpdateMobileDeviceResponse> responseObserver) {
        UUID userId = getCurrentUserId();

        UpdateMobileDeviceResponse response = service.updateMobileDevice(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
