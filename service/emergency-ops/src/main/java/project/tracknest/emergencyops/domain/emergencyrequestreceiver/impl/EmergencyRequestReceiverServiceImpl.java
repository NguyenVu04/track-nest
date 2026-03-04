package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.EmergencyRequestReceiverEmergencyServiceRepository;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.DeleteEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.GetTrackerEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestReceiverServiceImpl implements EmergencyRequestReceiverService {
    private final EmergencyRequestReceiverEmergencyRequestRepository emergencyRequestRepository;
    private final EmergencyRequestReceiverEmergencyRequestStatusRepository emergencyRequestStatusRepository;
    private final EmergencyRequestReceiverEmergencyServiceRepository emergencyServiceRepository;
    private final KeycloakService keycloakService;

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

        EmergencyRequest emergencyRequest = EmergencyRequest
                .builder()
                .senderId(userId)
                .targetId(request.getTargetId())
                .latitude(request.getLastLatitudeDegrees())
                .longitude(request.getLastLongitudeDegrees())
                .status(status.get())
                .emergencyService(emergencyService.get())
                .build();

        EmergencyRequest savedEmergencyRequest = emergencyRequestRepository.saveAndFlush(emergencyRequest);

        Long createdAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return new PostEmergencyRequestResponse(
                createdAtMs,
                savedEmergencyRequest.getId()
        );
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

    @Override
    public DeleteEmergencyRequestResponse deleteEmergencyRequest(UUID userId, UUID requestId) {
        Optional<EmergencyRequest> emergencyRequestOpt = emergencyRequestRepository
                .findByIdAndSenderId(requestId, userId);

        if (emergencyRequestOpt.isEmpty()) {
            log.error("Emergency request not found for deletion: requestId={}, userId={}", requestId, userId);
            throw new RuntimeException("Emergency request not found");
        }

        EmergencyRequest emergencyRequest = emergencyRequestOpt.get();
        emergencyRequestRepository.delete(emergencyRequest);

        Long deletedAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return new DeleteEmergencyRequestResponse(
                deletedAtMs,
                requestId
        );
    }
}
