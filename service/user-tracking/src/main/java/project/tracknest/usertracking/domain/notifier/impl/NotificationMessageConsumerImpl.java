package project.tracknest.usertracking.domain.notifier.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.configuration.firebase.FcmService;
import project.tracknest.usertracking.core.datatype.NotificationSentMessage;
import project.tracknest.usertracking.core.datatype.RiskNotificationMessage;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationMessageConsumerImpl implements NotificationMessageConsumer {
    private static final long INTERVAL_BETWEEN_NOTIFICATIONS_SECOND = 5 * 60; // 30 minutes
    private static final String RISK_NOTIFICATION_TYPE = "RISK";
    private static final String TRACKING_NOTIFICATION_TYPE = "TRACKING";

    private final FcmService fcmService;
    private final NotificationSentMessageProducer notificationSentMessageProducer;
    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackingNotificationRepository trackingNotificationRepository;
    private final NotifierTrackerTrackingNotificationRepository trackerTrackingNotificationRepository;

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
        User target = userOpt.get();

        TrackingNotification trackingNotification = TrackingNotification.builder()
                .target(target)
                .title(message.title())
                .content(message.content())
                .type(message.type())
                .build();

        TrackingNotification savedTrackingNotification = trackingNotificationRepository
                .saveAndFlush(trackingNotification);

        List<User> familyMembers = userRepository
                .findAllUserFamilyMembers(target.getId());

        for (User member : familyMembers) {

            Optional<TrackingNotification> lastFamilyNotificationOpt =
                    trackingNotificationRepository
                            .findTopByTarget_IdOrderByCreatedAt(member.getId());
            if (lastFamilyNotificationOpt.isPresent()) {
                OffsetDateTime lastFamilyNotificationTime =
                        lastFamilyNotificationOpt.get().getCreatedAt();
                if (shouldNotSendNotification(lastFamilyNotificationTime)) {
                    log.info("Skipping tracking notification to family member {} due to interval constraint.",
                            member.getId());
                    continue;
                }
            }

            List<MobileDevice> devices = mobileRepository
                    .findByTargetId(member.getId());
            List<String> deviceTokens = devices.stream()
                    .map(MobileDevice::getDeviceToken)
                    .toList();
            fcmService.sendToTokens(deviceTokens, message.title(), message.content());

            TrackerTrackingNotification.TrackerTrackingNotificationId trackerTrackingNotificationId =
                    TrackerTrackingNotification.TrackerTrackingNotificationId
                            .builder()
                            .trackerId(member.getId())
                            .notificationId(savedTrackingNotification.getId())
                            .build();
            TrackerTrackingNotification trackerTrackingNotification = TrackerTrackingNotification
                    .builder()
                    .id(trackerTrackingNotificationId)
                    .build();
            trackerTrackingNotificationRepository.save(trackerTrackingNotification);

        }

        NotificationSentMessage sentMessage = NotificationSentMessage
                .builder()
                .notificationId(savedTrackingNotification.getId())
                .type(TRACKING_NOTIFICATION_TYPE)
                .sent_at_ms(savedTrackingNotification
                        .getCreatedAt()
                        .toInstant()
                        .toEpochMilli())
                .build();

        notificationSentMessageProducer.produce(sentMessage);
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

        RiskNotification riskNotification = RiskNotification
                .builder()
                .type(message.type())
                .user(userOpt.get())
                .title(message.title())
                .content(message.content())
                .build();

        RiskNotification savedRiskNotification = riskNotificationRepository
                .saveAndFlush(riskNotification);

        NotificationSentMessage sentMessage = NotificationSentMessage
                .builder()
                .type(RISK_NOTIFICATION_TYPE)
                .notificationId(savedRiskNotification.getId())
                .sent_at_ms(savedRiskNotification
                        .getCreatedAt()
                        .toInstant()
                        .toEpochMilli())
                .build();

        notificationSentMessageProducer.produce(sentMessage);
    }
}
