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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationMessageConsumerImpl implements NotificationMessageConsumer {
    private static final String RISK_NOTIFICATION_TYPE = "RISK";
    private static final String TRACKING_NOTIFICATION_TYPE = "TRACKING";

    private final FcmService fcmService;
    private final NotificationSentMessageProducer notificationSentMessageProducer;
    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackingNotificationRepository trackingNotificationRepository;
    private final NotifierTrackerTrackingNotificationRepository trackerTrackingNotificationRepository;

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

        List<UUID> memberIds = familyMembers.stream().map(User::getId).toList();
        Map<UUID, List<String>> tokensByMember = mobileRepository.findAllByUserIdIn(memberIds)
                .stream()
                .collect(Collectors.groupingBy(
                        MobileDevice::getUserId,
                        Collectors.mapping(MobileDevice::getDeviceToken, Collectors.toList())));

        boolean anyDelivered = false;
        for (User member : familyMembers) {
            List<String> deviceTokens = tokensByMember.getOrDefault(member.getId(), List.of());
            int sent = fcmService.sendToTokens(deviceTokens, message.title(), message.content());
            if (sent > 0) anyDelivered = true;

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

        if (anyDelivered) {
            NotificationSentMessage sentMessage = NotificationSentMessage
                    .builder()
                    .notificationId(savedTrackingNotification.getId())
                    .type(TRACKING_NOTIFICATION_TYPE)
                    .sent_at_ms(OffsetDateTime.now().toInstant().toEpochMilli())
                    .build();
            notificationSentMessageProducer.produce(sentMessage);
        } else {
            log.warn("Skipping notification-sent audit for tracking notification {}: no FCM delivery succeeded",
                    savedTrackingNotification.getId());
        }
    }

    @Override
    @Transactional
    public void sendRiskNotification(RiskNotificationMessage message) {
        Optional<User> userOpt = userRepository.findById(message.userId());
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Skipping risk notification.", message.userId());
            return;
        }

        List<MobileDevice> devices = mobileRepository
                .findByTargetId(message.userId());

        List<String> deviceTokens = devices.stream()
                .map(MobileDevice::getDeviceToken)
                .toList();

        int sent = fcmService.sendToTokens(deviceTokens, message.title(), message.content());

        RiskNotification riskNotification = RiskNotification
                .builder()
                .type(message.type())
                .user(userOpt.get())
                .title(message.title())
                .content(message.content())
                .build();

        RiskNotification savedRiskNotification = riskNotificationRepository
                .saveAndFlush(riskNotification);

        if (sent > 0) {
            NotificationSentMessage sentMessage = NotificationSentMessage
                    .builder()
                    .type(RISK_NOTIFICATION_TYPE)
                    .notificationId(savedRiskNotification.getId())
                    .sent_at_ms(OffsetDateTime.now().toInstant().toEpochMilli())
                    .build();
            notificationSentMessageProducer.produce(sentMessage);
        } else {
            log.warn("Skipping notification-sent audit for risk notification {}: no FCM delivery succeeded",
                    savedRiskNotification.getId());
        }
    }
}
