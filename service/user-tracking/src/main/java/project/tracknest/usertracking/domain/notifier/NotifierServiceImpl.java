package project.tracknest.usertracking.domain.notifier;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.entity.MobileDevice;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.MobileDeviceRequest;
import project.tracknest.usertracking.proto.lib.RiskNotificationResponse;
import project.tracknest.usertracking.proto.lib.TrackingNotificationResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotifierServiceImpl implements NotifierService {
    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackerTrackingNotificationRepository trackingNotificationRepository;

    @Override
    public String registerMobileDevice(UUID userId, MobileDeviceRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("User with ID {} not found when registering mobile device", userId);
            throw new StatusRuntimeException(Status.INTERNAL.withDescription("User not found"));
        }

        MobileDevice device = MobileDevice.builder()
                .deviceToken(request.getDeviceToken())
                .userId(userId)
                .languageCode(request.getLanguageCode())
                .build();
        MobileDevice savedDevice = mobileRepository.save(device);
        log.info("Registered mobile device with ID {} for user ID {}", savedDevice.getId(), userId);
        return savedDevice.getId().toString();
    }

    @Override
    public void deleteMobileDevice(UUID userId, UUID deviceId) {
        mobileRepository.deleteMobileDeviceByIdAndUserId(deviceId, userId);
        log.info("Deleted mobile device with ID {} for user ID {}", deviceId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingNotificationResponse retrieveTrackingNotifications(UUID userId) {
        return null;
    }

    @Override
    public RiskNotificationResponse retrieveRiskNotifications(UUID userId) {
        return null;
    }

    @Override
    public void deleteTrackingNotification(UUID userId, UUID notificationId) {
        trackingNotificationRepository.deleteById_TrackerIdAndId_NotificationId(userId, notificationId);
    }

    @Override
    public void deleteRiskNotification(UUID userId, UUID notificationId) {
        riskNotificationRepository.deleteByIdAndUserId(notificationId, userId);
    }

    @Override
    public void deleteTrackingNotifications(UUID userId, List<UUID> notificationIds) {
        trackingNotificationRepository.deleteById_TrackerIdAndId_NotificationIdIn(userId, notificationIds);
    }

    @Override
    public void deleteRiskNotifications(UUID userId, List<UUID> notificationIds) {
        riskNotificationRepository.deleteByIdInAndUserId(notificationIds, userId);
    }

    @Override
    public void deleteAllTrackingNotifications(UUID userId) {
        trackingNotificationRepository.deleteById_TrackerId(userId);
    }

    @Override
    public void deleteAllRiskNotifications(UUID userId) {
        riskNotificationRepository.deleteByUserId(userId);
    }
}
