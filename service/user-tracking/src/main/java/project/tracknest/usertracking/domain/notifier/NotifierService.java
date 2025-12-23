package project.tracknest.usertracking.domain.notifier;

import project.tracknest.usertracking.proto.lib.MobileDeviceRequest;
import project.tracknest.usertracking.proto.lib.RiskNotificationResponse;
import project.tracknest.usertracking.proto.lib.TrackingNotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotifierService {
    String registerMobileDevice(UUID userId, MobileDeviceRequest request);
    void deleteMobileDevice(UUID userId, UUID deviceId);
    TrackingNotificationResponse retrieveTrackingNotifications(UUID userId);
    RiskNotificationResponse retrieveRiskNotifications(UUID userId);
    void deleteTrackingNotification(UUID userId, UUID notificationId);
    void deleteRiskNotification(UUID userId, UUID notificationId);
    void deleteTrackingNotifications(UUID userId, List<UUID> notificationIds);
    void deleteRiskNotifications(UUID userId, List<UUID> notificationIds);
    void deleteAllTrackingNotifications(UUID userId);
    void deleteAllRiskNotifications(UUID userId);
}
