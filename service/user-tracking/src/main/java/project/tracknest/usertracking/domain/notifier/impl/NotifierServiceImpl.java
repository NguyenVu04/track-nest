package project.tracknest.usertracking.domain.notifier.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.PageToken;
import project.tracknest.usertracking.core.entity.MobileDevice;
import project.tracknest.usertracking.core.entity.RiskNotification;
import project.tracknest.usertracking.core.entity.TrackerTrackingNotification;
import project.tracknest.usertracking.core.entity.TrackingNotification;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.domain.notifier.service.NotifierService;
import project.tracknest.usertracking.proto.lib.*;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class NotifierServiceImpl implements NotifierService {
    private static final int DEFAULT_PAGE_SIZE = 32;

    private final NotifierUserRepository userRepository;
    private final NotifierMobileDeviceRepository mobileRepository;
    private final NotifierRiskNotificationRepository riskNotificationRepository;
    private final NotifierTrackingNotificationRepository trackingNotificationRepository;
    private final NotifierTrackerTrackingNotificationRepository trackerNotificationRepository;

    @Override
    @Transactional
    public RegisterMobileDeviceResponse registerMobileDevice(
            UUID userId,
            RegisterMobileDeviceRequest request
    ) {
        String token = request.getDeviceToken();
        if (token.isBlank() || token.length() > 512) {
            return RegisterMobileDeviceResponse.newBuilder()
                    .setStatus(Status.newBuilder()
                            .setCode(Code.INVALID_ARGUMENT_VALUE)
                            .setMessage("Device token must be between 1 and 512 characters")
                            .build())
                    .build();
        }
        if (request.getPlatform().isBlank() || request.getPlatform().length() > 32) {
            return RegisterMobileDeviceResponse.newBuilder()
                    .setStatus(Status.newBuilder()
                            .setCode(Code.INVALID_ARGUMENT_VALUE)
                            .setMessage("Platform must be between 1 and 32 characters")
                            .build())
                    .build();
        }
        if (request.getLanguageCode().length() > 10) {
            return RegisterMobileDeviceResponse.newBuilder()
                    .setStatus(Status.newBuilder()
                            .setCode(Code.INVALID_ARGUMENT_VALUE)
                            .setMessage("Language code must be at most 10 characters")
                            .build())
                    .build();
        }

        if (!userRepository.existsById(userId)) {
            log.error("User with ID {} not found for mobile device registration", userId);
            return RegisterMobileDeviceResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.INTERNAL_VALUE)
                            .setMessage("User not found")
                            .build())
                    .build();
        }

        MobileDevice device = MobileDevice.builder()
                .deviceToken(request.getDeviceToken())
                .userId(userId)
                .languageCode(request.getLanguageCode())
                .platform(request.getPlatform())
                .build();

        MobileDevice savedDevice = mobileRepository.saveAndFlush(device);
        log.info("Registered mobile device with ID {} for user ID {}", savedDevice.getId(), userId);

        return RegisterMobileDeviceResponse
                .newBuilder()
                .setId(savedDevice.getId().toString())
                .setCreatedAtMs(Instant.now().toEpochMilli())
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Mobile device registered successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional
    public UpdateMobileDeviceResponse updateMobileDevice(
            UUID userId,
            UpdateMobileDeviceRequest request
    ) {
        UUID deviceId = UUID.fromString(request.getId());

        Optional<MobileDevice> deviceOpt = mobileRepository.findByIdAndUserId(
                deviceId,
                userId);

        if (deviceOpt.isEmpty()) {
            log.warn("Mobile device with ID {} not found for user ID {} when updating device token", deviceId, userId);
            return UpdateMobileDeviceResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Mobile device not found")
                            .build())
                    .build();
        }

        MobileDevice device = deviceOpt.get();
        device.setDeviceToken(request.getDeviceToken());
        device.setLanguageCode(request.getLanguageCode());
        device.setPlatform(request.getPlatform());

        mobileRepository.saveAndFlush(device);
        log.info("Updated mobile device with ID {} for user ID {}", deviceId, userId);

        return UpdateMobileDeviceResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Mobile device updated successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional
    public UnregisterMobileDeviceResponse unregisterMobileDevice(
            UUID userId,
            UnregisterMobileDeviceRequest request
    ) {
        UUID deviceId = UUID.fromString(request.getId());

        Optional<MobileDevice> deviceOpt = mobileRepository.findByIdAndUserId(
                deviceId,
                userId);

        if (deviceOpt.isEmpty()) {
            log.warn("Mobile device with ID {} not found for user ID {}", deviceId, userId);
            return UnregisterMobileDeviceResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Mobile device not found")
                            .build())
                    .build();
        }

        mobileRepository.deleteById(deviceId);
        log.info("Unregistered mobile device with ID {} for user ID {} when unregistering device", deviceId, userId);

        return UnregisterMobileDeviceResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Mobile device unregistered successfully")
                        .build())
                .build();
    }

    private PageToken buildNextTrackingNotificationToken(Slice<TrackingNotification> slice) {
        TrackingNotification last = slice.getContent()
                .get(slice.getNumberOfElements() - 1);

        return new PageToken(
                last.getCreatedAt().toInstant().toEpochMilli(),
                last.getId().toString()
        );
    }

    private TrackingNotificationResponse toTrackingNotificationProto(TrackingNotification notification) {
        return TrackingNotificationResponse.newBuilder()
                .setId(notification.getId().toString())
                .setMemberId(notification.getTarget().getId().toString())
                .setMemberUsername(notification.getTarget().getUsername())
                .setMemberAvatarUrl(
                        notification.getTarget().getAvatarUrl() == null
                                ? ""
                                : notification.getTarget().getAvatarUrl())
                .setContent(notification.getContent())
                .setTitle(notification.getTitle())
                .setCreatedAtMs(notification.getCreatedAt().toInstant().toEpochMilli())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ListTrackingNotificationsResponse listTrackingNotifications(
            UUID userId,
            ListTrackingNotificationsRequest request
    ) {
        PageToken cursor = PageTokenCodec.decode(request.getPageToken());

        int pageSize = request.getPageSize() > 0
                ? request.getPageSize()
                : DEFAULT_PAGE_SIZE;

        Pageable pageable = PageRequest.ofSize(pageSize);

        Slice<TrackingNotification> slice = cursor == null
                ? trackingNotificationRepository.findFirstPageByTrackerId(userId, pageable)
                : trackingNotificationRepository.findNextPageByTrackerId(
                userId,
                Instant.ofEpochMilli(cursor.lastCreatedAtMs())
                        .atOffset(ZoneOffset.UTC),
                UUID.fromString(cursor.lastId()),
                pageable);

        List<TrackingNotificationResponse> notifications = slice.getContent()
                .stream()
                .map(this::toTrackingNotificationProto)
                .toList();

        ListTrackingNotificationsResponse.Builder response = ListTrackingNotificationsResponse
                .newBuilder()
                .addAllTrackingNotifications(notifications);

        if (slice.hasNext()) {
            PageToken nextToken = buildNextTrackingNotificationToken(slice);
            response.setNextPageToken(PageTokenCodec.encode(nextToken));
        }

        return response.build();
    }

    private PageToken buildNextRiskNotificationToken(Slice<RiskNotification> slice) {
        RiskNotification last = slice.getContent()
                .get(slice.getNumberOfElements() - 1);

        return new PageToken(
                last.getCreatedAt().toInstant().toEpochMilli(),
                last.getId().toString()
        );
    }

    private RiskNotificationResponse toRiskNotificationProto(RiskNotification notification) {
        return RiskNotificationResponse.newBuilder()
                .setId(notification.getId().toString())
                .setMemberId(notification.getUser().getId().toString())
                .setMemberUsername(notification.getUser().getUsername())
                .setMemberAvatarUrl(
                        notification.getUser().getAvatarUrl() == null
                                ? ""
                                : notification.getUser().getAvatarUrl())
                .setContent(notification.getContent())
                .setTitle(notification.getTitle())
                .setCreatedAtMs(notification.getCreatedAt()
                        .toInstant().toEpochMilli())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ListRiskNotificationsResponse listRiskNotifications(
            UUID userId,
            ListRiskNotificationsRequest request
    ) {
        PageToken cursor = PageTokenCodec.decode(request.getPageToken());

        int pageSize = request.getPageSize() > 0
                ? request.getPageSize()
                : DEFAULT_PAGE_SIZE;

        Pageable pageable = PageRequest.ofSize(pageSize);

        Slice<RiskNotification> slice = cursor == null
                ? riskNotificationRepository.findFirstPageByUserId(userId, pageable)
                : riskNotificationRepository.findNextPageByUserId(
                userId,
                Instant.ofEpochMilli(cursor.lastCreatedAtMs())
                        .atOffset(ZoneOffset.UTC),
                UUID.fromString(cursor.lastId()),
                pageable);

        List<RiskNotificationResponse> notifications = slice.getContent()
                .stream()
                .map(this::toRiskNotificationProto)
                .toList();

        ListRiskNotificationsResponse.Builder response = ListRiskNotificationsResponse
                .newBuilder()
                .addAllRiskNotifications(notifications);

        if (slice.hasNext()) {
            PageToken nextToken = buildNextRiskNotificationToken(slice);
            response.setNextPageToken(PageTokenCodec.encode(nextToken));
        }

        return response.build();
    }

    @Override
    @Transactional
    public DeleteTrackingNotificationResponse deleteTrackingNotification(
            UUID userId,
            DeleteTrackingNotificationRequest request
    ) {
        UUID notificationId = UUID.fromString(request.getId());

        Optional<TrackerTrackingNotification> notificationOpt = trackerNotificationRepository
                .findById_TrackerIdAndId_NotificationId(
                        userId,
                        notificationId
                );
        if (notificationOpt.isEmpty()) {
            log.warn("Tracking notification with ID {} not found for tracker ID {}",
                    notificationId, userId);
            return DeleteTrackingNotificationResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Tracking notification not found")
                            .build())
                    .build();
        }

        trackerNotificationRepository.delete(notificationOpt.get());
        log.info("Deleted tracking notification with ID {} for tracker ID {}", notificationId, userId);
        return DeleteTrackingNotificationResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Tracking notification deleted successfully")
                        .build())
                .setDeletedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public DeleteRiskNotificationResponse deleteRiskNotification(
            UUID userId,
            DeleteRiskNotificationRequest request
    ) {
        UUID notificationId = UUID.fromString(request.getId());

        Optional<RiskNotification> notificationOpt = riskNotificationRepository
                .findByIdAndUserId(notificationId, userId);

        if (notificationOpt.isEmpty()) {
            log.warn("Risk notification with ID {} not found for user ID {}",
                    request.getId(), userId);
            return DeleteRiskNotificationResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Risk notification not found")
                            .build())
                    .build();
        }

        riskNotificationRepository.deleteById(notificationId);
        log.info("Deleted risk notification with ID {} for user ID {}", request.getId(), userId);
        return DeleteRiskNotificationResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Risk notification deleted successfully")
                        .build())
                .setDeletedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public DeleteTrackingNotificationsResponse deleteTrackingNotifications(
            UUID userId,
            DeleteTrackingNotificationsRequest request
    ) {
        List<UUID> notificationIds = request.getIdsList()
                .stream()
                .map(UUID::fromString)
                .toList();

        List<TrackerTrackingNotification> notifications = trackerNotificationRepository
                .findUserNotificationIds(notificationIds, userId);

        if (notifications.isEmpty()) {
            log.warn("No tracking notifications found for deletion for tracker ID {}", userId);
            return DeleteTrackingNotificationsResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("No tracking notifications found for deletion")
                            .build())
                    .build();
        }

        trackerNotificationRepository.deleteAll(notifications);
        log.info("Deleted {} tracking notifications for tracker ID {}", notifications.size(), userId);
        return DeleteTrackingNotificationsResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Tracking notifications deleted successfully")
                        .build())
                .setDeletedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public DeleteRiskNotificationsResponse deleteRiskNotifications(
            UUID userId,
            DeleteRiskNotificationsRequest request
    ) {
        List<UUID> notificationIds = request.getIdsList()
                .stream()
                .map(UUID::fromString)
                .toList();

        List<RiskNotification> notifications = riskNotificationRepository
                .findUserRiskNotifications(notificationIds, userId);

        if (notifications.isEmpty()) {
            log.warn("No risk notifications found for deletion for user ID {}", userId);
            return DeleteRiskNotificationsResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("No risk notifications found for deletion")
                            .build())
                    .build();
        }

        riskNotificationRepository.deleteAll(notifications);
        log.info("Deleted {} risk notifications for user ID {}", notifications.size(), userId);
        return DeleteRiskNotificationsResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Risk notifications deleted successfully")
                        .build())
                .setDeletedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public ClearTrackingNotificationsResponse clearTrackingNotifications(
            UUID userId,
            ClearTrackingNotificationsRequest request
    ) {
        trackerNotificationRepository.deleteById_TrackerId(userId);
        log.info("Cleared all tracking notifications for tracker ID {}", userId);

        return ClearTrackingNotificationsResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("All tracking notifications cleared successfully")
                        .build())
                .setClearedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public ClearRiskNotificationsResponse clearRiskNotifications(
            UUID userId,
            ClearRiskNotificationsRequest request
    ) {
        riskNotificationRepository.deleteByUserId(userId);
        log.info("Cleared all risk notifications for user ID {}", userId);

        return ClearRiskNotificationsResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("All risk notifications cleared successfully")
                        .build())
                .setClearedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    public CountTrackingNotificationsResponse countTrackingNotifications(UUID userId, CountTrackingNotificationsRequest request) {
        int count = trackerNotificationRepository.countById_TrackerId(userId);

        return CountTrackingNotificationsResponse
                .newBuilder()
                .setTotalCount(count)
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Count retrieved successfully"))
                .build();
    }

    @Override
    public CountRiskNotificationsResponse countRiskNotifications(UUID userId, CountRiskNotificationsRequest request) {
        int count = riskNotificationRepository.countByUser_Id(userId);

        return CountRiskNotificationsResponse
                .newBuilder()
                .setTotalCount(count)
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Count retrieved successfully"))
                .build();
    }
}
