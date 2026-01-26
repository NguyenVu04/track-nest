package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.notifier.NotifierService;
import project.tracknest.usertracking.proto.lib.*;

@GrpcService
@Slf4j
@RequiredArgsConstructor
public class NotifierController extends NotifierControllerGrpc.NotifierControllerImplBase {
    private final NotifierService service;

    @Override
    public void registerMobileDevice(RegisterMobileDeviceRequest request, StreamObserver<RegisterMobileDeviceResponse> responseObserver) {
        super.registerMobileDevice(request, responseObserver);
    }

    @Override
    public void unregisterMobileDevice(UnregisterMobileDeviceRequest request, StreamObserver<UnregisterMobileDeviceResponse> responseObserver) {
        super.unregisterMobileDevice(request, responseObserver);
    }

    @Override
    public void listTrackingNotifications(ListTrackingNotificationsRequest request, StreamObserver<ListTrackingNotificationsResponse> responseObserver) {
        super.listTrackingNotifications(request, responseObserver);
    }

    @Override
    public void listRiskNotifications(ListRiskNotificationsRequest request, StreamObserver<ListRiskNotificationsResponse> responseObserver) {
        super.listRiskNotifications(request, responseObserver);
    }

    @Override
    public void markTrackingNotificationAsSeen(MarkTrackingNotificationAsSeenRequest request, StreamObserver<MarkTrackingNotificationAsSeenResponse> responseObserver) {
        super.markTrackingNotificationAsSeen(request, responseObserver);
    }

    @Override
    public void markRiskNotificationAsSeen(MarkRiskNotificationAsSeenRequest request, StreamObserver<MarkRiskNotificationAsSeenResponse> responseObserver) {
        super.markRiskNotificationAsSeen(request, responseObserver);
    }

    @Override
    public void deleteTrackingNotification(DeleteTrackingNotificationRequest request, StreamObserver<DeleteTrackingNotificationResponse> responseObserver) {
        super.deleteTrackingNotification(request, responseObserver);
    }

    @Override
    public void deleteRiskNotification(DeleteRiskNotificationRequest request, StreamObserver<DeleteRiskNotificationResponse> responseObserver) {
        super.deleteRiskNotification(request, responseObserver);
    }

    @Override
    public void deleteTrackingNotifications(DeleteTrackingNotificationsRequest request, StreamObserver<DeleteTrackingNotificationsResponse> responseObserver) {
        super.deleteTrackingNotifications(request, responseObserver);
    }

    @Override
    public void deleteRiskNotifications(DeleteRiskNotificationsRequest request, StreamObserver<DeleteRiskNotificationsResponse> responseObserver) {
        super.deleteRiskNotifications(request, responseObserver);
    }

    @Override
    public void clearTrackingNotifications(ClearTrackingNotificationsRequest request, StreamObserver<ClearTrackingNotificationsResponse> responseObserver) {
        super.clearTrackingNotifications(request, responseObserver);
    }

    @Override
    public void clearRiskNotifications(ClearRiskNotificationsRequest request, StreamObserver<ClearRiskNotificationsResponse> responseObserver) {
        super.clearRiskNotifications(request, responseObserver);
    }
}
