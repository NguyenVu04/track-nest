package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.datatype.TrackingNotificationMessage;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestManagerServiceImpl implements EmergencyRequestManagerService {
    private final EmergencyRequestManagerEmergencyRequestRepository emergencyRequestRepository;
    private final EmergencyRequestManagerEmergencyRequestStatusRepository emergencyRequestStatusRepository;
    private final EmergencyRequestManagerEmergencyServiceUserRepository emergencyServiceUserRepository;
    private final EmergencyServiceManagerEmergencyServiceRepository emergencyServiceRepository;

    private final KeycloakService keycloakService;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Value("${app.kafka.topics[1]}")
    private String TRACKING_NOTIFICATION_TOPIC;

    private static final String TYPE_ACCEPTED = "EMERGENCY_REQUEST_ACCEPTED";
    private static final String TYPE_REJECTED = "EMERGENCY_REQUEST_REJECTED";
    private static final String TYPE_CLOSED   = "EMERGENCY_REQUEST_CLOSED";

    private void sendStatusChangeNotification(UUID targetId, String type, String title, String content) {
        TrackingNotificationMessage message = TrackingNotificationMessage.builder()
                .targetId(targetId)
                .type(type)
                .title(title)
                .content(content)
                .build();
        kafkaTemplate.send(TRACKING_NOTIFICATION_TOPIC, message);
        log.info("Sent {} notification to Kafka for target {}", type, targetId);
    }

    private GetEmergencyRequestsResponse mapToGetEmergencyRequestsResponse(
            EmergencyRequest request,
            Map<UUID, KeycloakUserProfile> profiles
    ) {
        KeycloakUserProfile senderProfile = profiles.get(request.getSenderId());
        KeycloakUserProfile targetProfile = profiles.get(request.getTargetId());

        return new GetEmergencyRequestsResponse(
            request.getId(),
            request.getSenderId(),
            senderProfile.username(),
            senderProfile.firstName(),
            senderProfile.lastName(),
            senderProfile.phoneNumber(),
            senderProfile.email(),
            senderProfile.avatarUrl(),
            targetProfile.id(),
            targetProfile.username(),
            targetProfile.firstName(),
            targetProfile.lastName(),
            targetProfile.phoneNumber(),
            targetProfile.email(),
            targetProfile.avatarUrl(),
            request.getOpenAt().toInstant().toEpochMilli(),
            request.getCloseAt() != null
                    ? request.getCloseAt()
                    .toInstant()
                    .toEpochMilli()
                    : null,
            request.getStatus().getName(),
            request.getLatitude(),
            request.getLongitude()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetRequestCountResponse getEmergencyRequestCount(UUID userId, EmergencyRequestStatus.Status status) {
        String statusValue = status != null ? status.getValue() : null;

        long count = emergencyRequestRepository.countEmergencyRequests(userId, statusValue);
        long timestampMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return new GetRequestCountResponse(count, timestampMs);
    }

    @Override
    @Transactional
    public PageResponse<GetEmergencyRequestsResponse> getEmergencyRequests(UUID userId, EmergencyRequestStatus.Status status, Pageable pageable) {
        String statusValue = status != null ? status.getValue() : null;

        Page<EmergencyRequest> emergencyRequestPage = emergencyRequestRepository
                .findServiceEmergencyRequests(userId, statusValue, pageable);

        List<EmergencyRequest> requests = emergencyRequestPage.getContent();
        Set<UUID> userIds = requests.stream()
                .flatMap(r -> Stream.of(r.getSenderId(), r.getTargetId()))
                .collect(Collectors.toSet());
        Map<UUID, KeycloakUserProfile> profiles = userIds.parallelStream()
                .collect(Collectors.toMap(id -> id, keycloakService::getUserProfile));

        List<GetEmergencyRequestsResponse> responseContent = requests.stream()
                .map(r -> mapToGetEmergencyRequestsResponse(r, profiles))
                .toList();

        return new PageResponse<>(
                responseContent,
                emergencyRequestPage.getTotalElements(),
                emergencyRequestPage.getTotalPages(),
                emergencyRequestPage.getNumber(),
                emergencyRequestPage.getSize()
        );
    }

    @Override
    @Transactional
    public AcceptEmergencyRequestResponse acceptEmergencyRequest(UUID userId, UUID requestId) {

        Optional<EmergencyRequest> requestOpt = emergencyRequestRepository
                .findByIdAndEmergencyService_Id(requestId, userId);

        if (requestOpt.isEmpty()) {
            log.warn("Emergency request with ID {} not found for service ID {} when trying to accept request", requestId, userId);
            throw new IllegalArgumentException("Emergency request not found");
        }

        EmergencyRequest request = requestOpt.get();
        if (!request.getStatus().is(EmergencyRequestStatus.Status.PENDING)) {
            log.warn("Emergency request with ID {} for service ID {} is not in PENDING status when trying to accept request", requestId, userId);
            throw new IllegalArgumentException("Only emergency requests in PENDING status can be accepted");
        }

        Optional<EmergencyRequestStatus> acceptedStatusOpt = emergencyRequestStatusRepository
                .findById(EmergencyRequestStatus.Status.ACCEPTED.getValue());

        if (acceptedStatusOpt.isEmpty()) {
            log.error("Emergency request status 'ACCEPTED' not found when trying to accept request with ID {} for service ID {}", requestId, userId);
            throw new IllegalStateException("Emergency request status 'ACCEPTED' not found");
        }

        EmergencyRequestStatus acceptedStatus = acceptedStatusOpt.get();

        request.setStatus(acceptedStatus);

        emergencyRequestRepository.save(request);

        OffsetDateTime now = OffsetDateTime.now();

        EmergencyServiceUser serviceUser = EmergencyServiceUser
                .builder()
                .userId(request.getTargetId())
                .emergencyService(request.getEmergencyService())
                .lastLatitude(request.getLatitude())
                .lastLongitude(request.getLongitude())
                .lastUpdateTime(now)
                .build();

        emergencyServiceUserRepository.save(serviceUser);

        Long acceptedAtMs = now.toInstant().toEpochMilli();

        sendStatusChangeNotification(
                request.getTargetId(),
                TYPE_ACCEPTED,
                "Emergency Request Accepted",
                "Your emergency request has been accepted. Help is on the way."
        );

        return new AcceptEmergencyRequestResponse(
                acceptedAtMs,
                request.getId()
        );

    }

    @Override
    @Transactional
    public RejectEmergencyRequestResponse rejectEmergencyRequest(UUID userId, UUID requestId) {
        Optional<EmergencyRequest> requestOpt = emergencyRequestRepository
                .findByIdAndEmergencyService_Id(requestId, userId);

        if (requestOpt.isEmpty()) {
            log.warn("Emergency request with ID {} not found for service ID {} when trying to reject request", requestId, userId);
            throw new IllegalArgumentException("Emergency request not found");
        }

        EmergencyRequest request = requestOpt.get();
        if (!request.getStatus().is(EmergencyRequestStatus.Status.PENDING)) {
            log.warn("Emergency request with ID {} for service ID {} is not in PENDING status when trying to reject request", requestId, userId);
            throw new IllegalArgumentException("Only emergency requests in PENDING status can be rejected");
        }

        Optional<EmergencyRequestStatus> rejectedStatusOpt = emergencyRequestStatusRepository
                .findById(EmergencyRequestStatus.Status.REJECTED.getValue());

        if (rejectedStatusOpt.isEmpty()) {
            log.error("Emergency request status 'REJECTED' not found when trying to reject request with ID {} for service ID {}", requestId, userId);
            throw new IllegalStateException("Emergency request status 'REJECTED' not found");
        }

        EmergencyRequestStatus rejectedStatus = rejectedStatusOpt.get();

        OffsetDateTime now = OffsetDateTime.now();
        Long rejectedAtMs = now
                .toInstant()
                .toEpochMilli();

        request.setStatus(rejectedStatus);
        request.setCloseAt(now);

        emergencyRequestRepository.save(request);

        sendStatusChangeNotification(
                request.getTargetId(),
                TYPE_REJECTED,
                "Emergency Request Rejected",
                "Your emergency request could not be handled at this time. Please contact another service."
        );

        return new RejectEmergencyRequestResponse(
                rejectedAtMs,
                request.getId()
        );
    }

    @Override
    @Transactional
    public CloseEmergencyRequestResponse closeEmergencyRequest(UUID userId, UUID requestId) {
        Optional<EmergencyRequest> requestOpt = emergencyRequestRepository
                .findByIdAndEmergencyService_Id(requestId, userId);

        if (requestOpt.isEmpty()) {
            log.warn("Emergency request with ID {} not found for service ID {} when trying to close request", requestId, userId);
            throw new IllegalArgumentException("Emergency request not found");
        }

        EmergencyRequest request = requestOpt.get();
        if (!request.getStatus().is(EmergencyRequestStatus.Status.ACCEPTED)) {
            log.warn("Emergency request with ID {} for service ID {} is not in ACCEPTED status when trying to close request", requestId, userId);
            throw new IllegalArgumentException("Only emergency requests in ACCEPTED status can be closed");
        }

        Optional<EmergencyRequestStatus> closedStatusOpt = emergencyRequestStatusRepository
                .findById(EmergencyRequestStatus.Status.CLOSED.getValue());

        if (closedStatusOpt.isEmpty()) {
            log.error("Emergency request status 'CLOSED' not found when trying to close request with ID {} for service ID {}", requestId, userId);
            throw new IllegalStateException("Emergency request status 'CLOSED' not found");
        }

        EmergencyRequestStatus closedStatus = closedStatusOpt.get();

        OffsetDateTime now = OffsetDateTime.now();
        Long closedAtMs = now
                .toInstant()
                .toEpochMilli();

        request.setStatus(closedStatus);
        request.setCloseAt(now);

        emergencyRequestRepository.save(request);

        Optional<EmergencyServiceUser> userOpt = emergencyServiceUserRepository
                .findByEmergencyService_IdAndUserId(userId, request.getTargetId());

        if (userOpt.isEmpty()) {
            log.warn("Target user with ID {} is not being tracked by Emergency Service with ID {} when trying to close request", request.getTargetId(), userId);
        } else {
            EmergencyServiceUser targetUser = userOpt.get();
            emergencyServiceUserRepository.delete(targetUser);
        }

        sendStatusChangeNotification(
                request.getTargetId(),
                TYPE_CLOSED,
                "Emergency Request Closed",
                "Your emergency request has been closed. We hope you are safe."
        );

        return new CloseEmergencyRequestResponse(
                closedAtMs,
                request.getId()
        );
    }

    @Override
    @Transactional
    public PatchEmergencyServiceLocationResponse updateEmergencyServiceLocation(UUID userId, PatchEmergencyServiceLocationRequest request) {
        Optional<EmergencyService> serviceOpt = emergencyServiceRepository
                .findById(userId);

        if (serviceOpt.isEmpty()) {
            log.warn("Emergency Service with ID {} not found when trying to update service location", userId);
            throw new IllegalArgumentException("Emergency Service not found");
        }

        EmergencyService service = serviceOpt.get();
        service.setLongitude(request.getLongitudeDegrees());
        service.setLatitude(request.getLatitudeDegrees());

        emergencyServiceRepository.save(service);

        long updatedAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return new PatchEmergencyServiceLocationResponse(
                updatedAtMs, service.getId()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetEmergencyServiceLocationResponse getEmergencyServiceLocation(UUID userId) {
        Optional<EmergencyService> serviceOpt = emergencyServiceRepository
                .findById(userId);

        if (serviceOpt.isEmpty()) {
            log.warn("Emergency Service with ID {} not found when trying to get service location", userId);
            throw new IllegalArgumentException("Emergency Service not found");
        }

        EmergencyService service = serviceOpt.get();

        return new GetEmergencyServiceLocationResponse(
                service.getLatitude(),
                service.getLongitude(),
                service.getUpdatedAt() != null
                        ? service.getUpdatedAt()
                        .toInstant()
                        .toEpochMilli()
                        : null
        );
    }
}
