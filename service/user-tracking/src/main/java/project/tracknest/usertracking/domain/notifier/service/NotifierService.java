package project.tracknest.usertracking.domain.notifier.service;

import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

public interface NotifierService {
    RegisterMobileDeviceResponse registerMobileDevice(
            UUID userId,
            RegisterMobileDeviceRequest request);

    UnregisterMobileDeviceResponse unregisterMobileDevice(
            UUID userId,
            UnregisterMobileDeviceRequest request);

    ListTrackingNotificationsResponse listTrackingNotifications(
            UUID userId,
            ListTrackingNotificationsRequest request);

    ListRiskNotificationsResponse listRiskNotifications(
            UUID userId,
            ListRiskNotificationsRequest request);

    DeleteTrackingNotificationResponse deleteTrackingNotification(
            UUID userId,
            DeleteTrackingNotificationRequest request);

    DeleteRiskNotificationResponse deleteRiskNotification(
            UUID userId,
            DeleteRiskNotificationRequest request);

    DeleteTrackingNotificationsResponse deleteTrackingNotifications(
            UUID userId,
            DeleteTrackingNotificationsRequest request);

    DeleteRiskNotificationsResponse deleteRiskNotifications(
            UUID userId,
            DeleteRiskNotificationsRequest request);

    ClearTrackingNotificationsResponse clearTrackingNotifications(
            UUID userId,
            ClearTrackingNotificationsRequest request);

    ClearRiskNotificationsResponse clearRiskNotifications(
            UUID userId,
            ClearRiskNotificationsRequest request);

    CountTrackingNotificationsResponse countTrackingNotifications(
            UUID userId,
            CountTrackingNotificationsRequest request);

    CountRiskNotificationsResponse countRiskNotifications(
            UUID userId,
            CountRiskNotificationsRequest request);
}
