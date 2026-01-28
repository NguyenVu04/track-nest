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
import project.tracknest.usertracking.core.entity.*;
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

    private final UserRepository userRepository;
    private final MobileDeviceRepository mobileRepository;
    private final RiskNotificationRepository riskNotificationRepository;
    private final TrackingNotificationRepository trackingNotificationRepository;
    private final TrackerTrackingNotificationRepository trackerNotificationRepository;

    @Override
    @Transactional
    public RegisterMobileDeviceResponse registerMobileDevice(
            UUID userId,
            RegisterMobileDeviceRequest request
    ) {
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
                .build();

        MobileDevice savedDevice = mobileRepository.save(device);
        log.info("Registered mobile device with ID {} for user ID {}", savedDevice.getId(), userId);

        return RegisterMobileDeviceResponse
                .newBuilder()
                .setId(savedDevice
                        .getId()
                        .toString())
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Mobile device registered successfully")
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
        log.info("Unregistered mobile device with ID {} for user ID {}", deviceId, userId);

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
                .setMemberAvatarUrl(notification.getTarget().getAvatarUrl())
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

        Slice<TrackingNotification> slice = trackingNotificationRepository
                .findByTrackerId(
                        userId,
                        cursor == null
                                ? null
                                : Instant.ofEpochMilli(cursor.lastCreatedAtMs())
                                .atOffset(ZoneOffset.UTC),
                        cursor == null
                                ? null
                                : UUID.fromString(cursor.lastId()),
                        pageable
                );

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
                .setMemberAvatarUrl(notification.getUser().getAvatarUrl())
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

        Slice<RiskNotification> slice = riskNotificationRepository
                .findByUserId(
                        userId,
                        cursor == null
                                ? null
                                : Instant.ofEpochMilli(cursor.lastCreatedAtMs())
                                .atOffset(ZoneOffset.UTC),
                        cursor == null
                                ? null
                                : UUID.fromString(cursor.lastId()),
                        pageable
                );

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
