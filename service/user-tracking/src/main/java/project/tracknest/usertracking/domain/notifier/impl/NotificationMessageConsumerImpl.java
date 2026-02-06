package project.tracknest.usertracking.domain.notifier.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.configuration.firebase.FcmService;
import project.tracknest.usertracking.core.datatype.RiskNotificationMessage;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.MobileDevice;
import project.tracknest.usertracking.core.entity.RiskNotification;
import project.tracknest.usertracking.core.entity.TrackingNotification;
import project.tracknest.usertracking.core.entity.User;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationMessageConsumerImpl implements NotificationMessageConsumer {
    private static final long INTERVAL_BETWEEN_NOTIFICATIONS_SECOND = 30 * 60; // 30 minutes

    private final FcmService fcmService;
    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackingNotificationRepository trackingNotificationRepository;

    private boolean shouldNotSendNotification(OffsetDateTime lastNotificationTime) {
        if (lastNotificationTime == null) {
            return false;
        }
        OffsetDateTime now = OffsetDateTime.now();
        long secondsSinceLastNotification = Duration.between(lastNotificationTime, now)
                .getSeconds();
        return secondsSinceLastNotification < INTERVAL_BETWEEN_NOTIFICATIONS_SECOND;
    }

    @Override
    @Transactional
    public void sendTrackingNotification(TrackingNotificationMessage message) {
        Optional<User> userOpt = userRepository.findById(message.targetId());
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Skipping tracking notification.", message.targetId());
            return;
        }

        Optional<TrackingNotification> lastNotificationOpt =
                trackingNotificationRepository
                        .findTopByTarget_IdOrderByCreatedAt(message.targetId());
        if (lastNotificationOpt.isPresent()) {
            OffsetDateTime lastNotificationTime =
                    lastNotificationOpt.get().getCreatedAt();
            if (shouldNotSendNotification(lastNotificationTime)) {
                log.info("Skipping tracking notification to user {} due to interval constraint.",
                        message.targetId());
                return;
            }
        }

        List<MobileDevice> devices = mobileRepository
                .findAllByUserId(message.targetId());

        List<String> deviceTokens = devices.stream()
                .map(MobileDevice::getDeviceToken)
                .toList();

        fcmService.sendToTokens(deviceTokens, message.title(), message.content());

        TrackingNotification trackingNotification = TrackingNotification.builder()
                .target(userOpt.get())
                .title(message.title())
                .content(message.content())
                .type(message.type())
                .build();

        trackingNotificationRepository.save(trackingNotification);
    }

    @Override
    @Transactional
    public void sendRiskNotification(RiskNotificationMessage message) {
        Optional<User> userOpt = userRepository.findById(message.userId());
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Skipping risk notification.", message.userId());
            return;
        }

        Optional<RiskNotification> lastNotificationOpt =
                riskNotificationRepository
                        .findTopByUser_IdOrderByCreatedAt(message.userId());
        if (lastNotificationOpt.isPresent()) {
            OffsetDateTime lastNotificationTime =
                    lastNotificationOpt.get().getCreatedAt();
            if (shouldNotSendNotification(lastNotificationTime)) {
                log.info("Skipping risk notification to user {} due to interval constraint.",
                        message.userId());
                return;
            }
        }

        List<MobileDevice> devices = mobileRepository
                .findByTargetId(message.userId());

        List<String> deviceTokens = devices.stream()
                .map(MobileDevice::getDeviceToken)
                .toList();

        fcmService.sendToTokens(deviceTokens, message.title(), message.content());
    }
}
