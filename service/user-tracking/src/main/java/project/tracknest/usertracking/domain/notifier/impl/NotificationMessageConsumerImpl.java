package project.tracknest.usertracking.domain.notifier.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
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
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationMessageConsumerImpl implements NotificationMessageConsumer {
    private static final String RISK_NOTIFICATION_TYPE = "RISK";
    private static final String TRACKING_NOTIFICATION_TYPE = "TRACKING";
    private static final String FCM_DATA_TYPE_KEY = "type";
    private static final String FCM_DATA_ROUTE_KEY = "route";

    private final FcmService fcmService;
    private final TransactionTemplate transactionTemplate;
    private final NotificationSentMessageProducer notificationSentMessageProducer;
    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackingNotificationRepository trackingNotificationRepository;
    private final NotifierTrackerTrackingNotificationRepository trackerTrackingNotificationRepository;

    private record TrackingSetup(
            UUID notificationId,
            List<UUID> memberIds,
            List<String> targetTokens,
            List<String> allMemberTokens
    ) {}

    private record RiskSetup(
            UUID notificationId,
            List<String> deviceTokens
    ) {}

    @Override
    public void sendTrackingNotification(TrackingNotificationMessage message) {
        // Phase 1 — transaction: save notification record, load family + token data
        TrackingSetup setup = transactionTemplate.execute(status -> {
            Optional<User> userOpt = userRepository.findById(message.targetId());
            if (userOpt.isEmpty()) {
                log.warn("User with id {} not found. Skipping tracking notification.", message.targetId());
                return null;
            }
            User target = userOpt.get();

            TrackingNotification saved = trackingNotificationRepository.saveAndFlush(
                    TrackingNotification.builder()
                            .target(target)
                            .title(message.title())
                            .content(message.content())
                            .type(message.type())
                            .build());

            List<User> familyMembers = userRepository.findAllUserFamilyMembers(target.getId());
            List<UUID> memberIds = familyMembers.stream().map(User::getId).toList();
            if (memberIds.isEmpty()) {
                log.warn("No family members found for target user {}. Skipping FCM delivery.", target.getId());
                return new TrackingSetup(saved.getId(), List.of(), List.of(), List.of());
            }

            List<String> targetTokens = mobileRepository.findAllByUserId(target.getId())
                    .stream()
                    .map(MobileDevice::getDeviceToken)
                    .distinct()
                    .toList();

            List<String> allMemberTokens = mobileRepository.findAllByUserIdIn(memberIds)
                    .stream()
                    .map(MobileDevice::getDeviceToken)
                    .distinct()
                    .toList();

            return new TrackingSetup(saved.getId(), memberIds, targetTokens, allMemberTokens);
        });

        if (setup == null || setup.memberIds().isEmpty()) return;

        // Phase 2 — no transaction: FCM (one batched call per audience)
        FcmService.FcmResult targetResult = setup.targetTokens().isEmpty()
                ? new FcmService.FcmResult(0, List.of())
                : fcmService.sendToTokensWithData(
                        setup.targetTokens(), message.title(), message.content(),
                        Map.of(FCM_DATA_TYPE_KEY, message.type(), FCM_DATA_ROUTE_KEY, "/(app)/sos"));

        FcmService.FcmResult memberResult = setup.allMemberTokens().isEmpty()
                ? new FcmService.FcmResult(0, List.of())
                : fcmService.sendToTokensWithData(
                        setup.allMemberTokens(), message.title(), message.content(),
                        Map.of(FCM_DATA_TYPE_KEY, message.type(), FCM_DATA_ROUTE_KEY, "/(app)/sos"));

        boolean anyDelivered = targetResult.successCount() > 0 || memberResult.successCount() > 0;

        List<String> staleTokens = Stream.concat(
                targetResult.staleTokens().stream(),
                memberResult.staleTokens().stream()
        ).toList();

        // Phase 3 — new transaction: persist tracker links + purge stale tokens
        transactionTemplate.execute(status -> {
            purgeStaleTokens(staleTokens);
            for (UUID memberId : setup.memberIds()) {
                trackerTrackingNotificationRepository.save(
                        TrackerTrackingNotification.builder()
                                .id(TrackerTrackingNotification.TrackerTrackingNotificationId.builder()
                                        .trackerId(memberId)
                                        .notificationId(setup.notificationId())
                                        .build())
                                .build());
            }
            return null;
        });

        if (anyDelivered) {
            notificationSentMessageProducer.produce(NotificationSentMessage.builder()
                    .notificationId(setup.notificationId())
                    .type(TRACKING_NOTIFICATION_TYPE)
                    .sent_at_ms(OffsetDateTime.now().toInstant().toEpochMilli())
                    .build());
        } else {
            log.warn("Skipping notification-sent audit for tracking notification {}: no FCM delivery succeeded",
                    setup.notificationId());
        }
    }

    @Override
    public void sendRiskNotification(RiskNotificationMessage message) {
        // Phase 1 — transaction: save notification record + load device tokens
        RiskSetup setup = transactionTemplate.execute(status -> {
            Optional<User> userOpt = userRepository.findById(message.userId());
            if (userOpt.isEmpty()) {
                log.warn("User with id {} not found. Skipping risk notification.", message.userId());
                return null;
            }

            RiskNotification saved = riskNotificationRepository.saveAndFlush(
                    RiskNotification.builder()
                            .type(message.type())
                            .user(userOpt.get())
                            .title(message.title())
                            .content(message.content())
                            .build());

            List<String> familyTokens = mobileRepository.findByTargetId(message.userId())
                    .stream().map(MobileDevice::getDeviceToken).toList();
            List<String> ownTokens = mobileRepository.findAllByUserId(message.userId())
                    .stream().map(MobileDevice::getDeviceToken).toList();
            List<String> deviceTokens = Stream.concat(familyTokens.stream(), ownTokens.stream())
                    .distinct().toList();

            if (deviceTokens.isEmpty()) {
                log.warn("No devices found for at-risk user {} or their family members.", message.userId());
            }

            return new RiskSetup(saved.getId(), deviceTokens);
        });

        if (setup == null) return;

        // Phase 2 — no transaction: FCM
        FcmService.FcmResult fcmResult = fcmService.sendToTokensWithData(
                setup.deviceTokens(), message.title(), message.content(),
                Map.of(FCM_DATA_TYPE_KEY, message.type(), FCM_DATA_ROUTE_KEY, "/(app)/notifications"));

        // Phase 3 — new transaction: purge stale tokens
        transactionTemplate.execute(status -> {
            purgeStaleTokens(fcmResult.staleTokens());
            return null;
        });

        if (fcmResult.successCount() > 0) {
            notificationSentMessageProducer.produce(NotificationSentMessage.builder()
                    .type(RISK_NOTIFICATION_TYPE)
                    .notificationId(setup.notificationId())
                    .sent_at_ms(OffsetDateTime.now().toInstant().toEpochMilli())
                    .build());
        } else {
            log.warn("Skipping notification-sent audit for risk notification {}: no FCM delivery succeeded",
                    setup.notificationId());
        }
    }

    private void purgeStaleTokens(List<String> staleTokens) {
        if (staleTokens.isEmpty()) return;
        log.info("Purging {} stale FCM token(s) from DB", staleTokens.size());
        mobileRepository.deleteAllByDeviceTokenIn(staleTokens);
    }
}
