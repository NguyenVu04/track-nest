package project.tracknest.usertracking.domain.notifier;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.*;

public interface NotifierService {
    void registerMobileDevice(
            RegisterMobileDeviceRequest request,
            StreamObserver<RegisterMobileDeviceResponse> responseObserver
    );

    void unregisterMobileDevice(
            UnregisterMobileDeviceRequest request,
            StreamObserver<UnregisterMobileDeviceResponse> responseObserver
    );

    void listTrackingNotifications(
            ListTrackingNotificationsRequest request,
            StreamObserver<ListTrackingNotificationsResponse> responseObserver);

    void listRiskNotifications(
            ListRiskNotificationsRequest request,
            StreamObserver<ListRiskNotificationsResponse> responseObserver);

    void markTrackingNotificationAsSeen(
            MarkTrackingNotificationAsSeenRequest request,
            StreamObserver<MarkTrackingNotificationAsSeenResponse> responseObserver
    );

    void markRiskNotificationAsSeen(
            MarkRiskNotificationAsSeenRequest request,
            StreamObserver<MarkRiskNotificationAsSeenResponse> responseObserver
    );

    void deleteTrackingNotification(
            DeleteTrackingNotificationRequest request,
            StreamObserver<DeleteTrackingNotificationResponse> responseObserver
    );

    public void deleteRiskNotification(
            DeleteRiskNotificationRequest request,
            StreamObserver<DeleteRiskNotificationResponse> responseObserver);

    void deleteTrackingNotifications(
            DeleteTrackingNotificationsRequest request,
            StreamObserver<DeleteTrackingNotificationsResponse> responseObserver
    );

    void deleteRiskNotifications(
            DeleteRiskNotificationsRequest request,
            StreamObserver<DeleteRiskNotificationsResponse> responseObserver
    );

    void clearTrackingNotifications(
            ClearTrackingNotificationsRequest request,
            StreamObserver<ClearTrackingNotificationsResponse> responseObserver
    );

    void clearRiskNotifications(
            ClearRiskNotificationsRequest request,
            StreamObserver<ClearRiskNotificationsResponse> responseObserver
    );
}
