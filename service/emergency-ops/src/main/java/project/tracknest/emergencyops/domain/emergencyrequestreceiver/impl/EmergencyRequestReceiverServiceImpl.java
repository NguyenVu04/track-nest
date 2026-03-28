package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessage;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessagePublisher;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.datatype.TrackingNotificationMessage;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.*;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverSubscriber;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestReceiverServiceImpl implements EmergencyRequestReceiverService, EmergencyRequestReceiverSubscriber {
    private static final String TRACKING_NOTIFICATION_MESSAGE_TYPE = "EMERGENCY_REQUEST_ASSIGNED";
    private static final String TRACKING_NOTIFICATION_TITLE = "New Emergency Request Assigned";
    private static final String TRACKING_NOTIFICATION_CONTENT_TEMPLATE = "An emergency request for family member %s has been assigned to emergency service %s.";

    @Value("${app.stomp.queue.emergency-request}")
    private String emergencyRequestQueue;

    @Value("${app.kafka.topics[1]}")
    private String TOPIC;

    private final EmergencyRequestReceiverEmergencyRequestRepository emergencyRequestRepository;
    private final EmergencyRequestReceiverEmergencyRequestStatusRepository emergencyRequestStatusRepository;
    private final EmergencyRequestReceiverEmergencyServiceRepository emergencyServiceRepository;
    private final KeycloakService keycloakService;
    private final ServerRedisMessagePublisher redisPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Override
    @Transactional
    public PostEmergencyRequestResponse createEmergencyRequest(UUID userId, PostEmergencyRequestRequest request) {
        Optional<EmergencyRequestStatus> status = emergencyRequestStatusRepository
                .findById(EmergencyRequestStatus.Status.PENDING.getValue());

        if (status.isEmpty()) {
            log.error("Emergency request status not found: {}", EmergencyRequestStatus.Status.PENDING.getValue());
            throw new RuntimeException("Emergency request status not found when creating emergency request");
        }

        Optional<EmergencyService> emergencyService = emergencyServiceRepository
                .findNearestEmergencyService(
                        request.getLastLatitudeDegrees(),
                        request.getLastLongitudeDegrees()
                );

        if (emergencyService.isEmpty()) {
            log.error("No emergency service found near location: ({}, {})", request.getLastLatitudeDegrees(), request.getLastLongitudeDegrees());
            throw new RuntimeException("No emergency service found near your location");
        }

        EmergencyService service = emergencyService.get();
        EmergencyRequest emergencyRequest = EmergencyRequest
                .builder()
                .senderId(userId)
                .targetId(request.getTargetId())
                .latitude(request.getLastLatitudeDegrees())
                .longitude(request.getLastLongitudeDegrees())
                .status(status.get())
                .emergencyService(service)
                .build();

        EmergencyRequest savedEmergencyRequest = emergencyRequestRepository
                .saveAndFlush(emergencyRequest);

        long createdAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        AssignedEmergencyRequestMessage assignedMessage = new AssignedEmergencyRequestMessage(
                savedEmergencyRequest.getId(),
                createdAtMs
        );
        sendAssignedEmergencyRequest(service.getId(), assignedMessage);

        KeycloakUserProfile profile = keycloakService.getUserProfile(emergencyRequest.getTargetId());
        TrackingNotificationMessage trackingNotificationMessage = TrackingNotificationMessage
                .builder()
                .title(TRACKING_NOTIFICATION_TITLE)
                .content(String.format(
                        TRACKING_NOTIFICATION_CONTENT_TEMPLATE,
                        profile.username(),
                        service.getUsername()))
                .type(TRACKING_NOTIFICATION_MESSAGE_TYPE)
                .targetId(request.getTargetId())
                .build();

        kafkaTemplate.send(TOPIC, trackingNotificationMessage);
        log.info("Sent tracking notification message to Kafka for emergency request {}: {}", savedEmergencyRequest.getId(), trackingNotificationMessage);

        return new PostEmergencyRequestResponse(
                createdAtMs,
                savedEmergencyRequest.getId()
        );
    }

    private void sendAssignedEmergencyRequest(UUID serviceId, AssignedEmergencyRequestMessage message) {
        ServerRedisMessage redisMessage = ServerRedisMessage
                .builder()
                .method("receiveEmergencyRequestMessage")
                .receiverId(serviceId)
                .payload(message)
                .build();
        redisPublisher.publishMessage(redisMessage, redisMessage.getReceiverId());
        log.info("Published emergency request assignment to Redis for service {}: {}", serviceId, message);
    }

    @Override
    public void receiveEmergencyRequestMessage(UUID receiverId, AssignedEmergencyRequestMessage message) {
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                emergencyRequestQueue,
                message);
    }

    private GetTrackerEmergencyRequestsResponse mapToGetTrackerEmergencyRequestsResponse(EmergencyRequest emergencyRequest) {
        EmergencyService service = emergencyRequest.getEmergencyService();

        KeycloakUserProfile profile = keycloakService.getUserProfile(emergencyRequest.getTargetId());

        return new GetTrackerEmergencyRequestsResponse(
                emergencyRequest.getId(),
                service.getId(),
                service.getUsername(),
                service.getPhoneNumber(),
                emergencyRequest.getOpenAt().toInstant().toEpochMilli(),
                emergencyRequest.getCloseAt() != null
                        ? emergencyRequest.getCloseAt()
                        .toInstant()
                        .toEpochMilli()
                        : null,
                profile.id(),
                profile.username(),
                profile.phoneNumber(),
                profile.email(),
                profile.firstName(),
                profile.lastName(),
                profile.avatarUrl(),
                emergencyRequest.getStatus().getName()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GetTrackerEmergencyRequestsResponse> retrieveTrackerEmergencyRequests(UUID userId, Pageable pageable) {
        Page<EmergencyRequest> emergencyRequestPage = emergencyRequestRepository
                .findBySenderId(userId, pageable);

        List<GetTrackerEmergencyRequestsResponse> emergencyRequestResponses = emergencyRequestPage
                .stream()
                .map(this::mapToGetTrackerEmergencyRequestsResponse)
                .toList();

        return new PageResponse<>(
                emergencyRequestResponses,
                emergencyRequestPage.getTotalElements(),
                emergencyRequestPage.getTotalPages(),
                emergencyRequestPage.getNumber(),
                emergencyRequestPage.getSize()
        );
    }
}
