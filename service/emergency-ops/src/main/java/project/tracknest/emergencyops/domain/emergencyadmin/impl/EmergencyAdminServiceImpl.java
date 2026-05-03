package project.tracknest.emergencyops.domain.emergencyadmin.impl;

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
import project.tracknest.emergencyops.domain.emergencyadmin.impl.datatype.GetAllEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyadmin.service.EmergencyAdminService;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyAdminServiceImpl implements EmergencyAdminService {

    private final EmergencyAdminEmergencyRequestRepository emergencyRequestRepository;
    private final KeycloakService keycloakService;

    private GetAllEmergencyRequestsResponse mapToResponse(
            EmergencyRequest request,
            Map<UUID, KeycloakUserProfile> profiles
    ) {
        KeycloakUserProfile senderProfile = profiles.get(request.getSenderId());
        KeycloakUserProfile targetProfile = profiles.get(request.getTargetId());

        return new GetAllEmergencyRequestsResponse(
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
                        ? request.getCloseAt().toInstant().toEpochMilli()
                        : null,
                request.getStatus().getName(),
                request.getLatitude(),
                request.getLongitude()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GetAllEmergencyRequestsResponse> getAllEmergencyRequests(
            EmergencyRequestStatus.Status status,
            Pageable pageable
    ) {
        String statusValue = status != null ? status.getValue() : null;

        Page<EmergencyRequest> page = emergencyRequestRepository
                .findAllEmergencyRequests(statusValue, pageable);

        List<EmergencyRequest> requests = page.getContent();

        Set<UUID> userIds = requests.stream()
                .flatMap(r -> Stream.of(r.getSenderId(), r.getTargetId()))
                .collect(Collectors.toSet());

        Map<UUID, KeycloakUserProfile> profiles = userIds.parallelStream()
                .collect(Collectors.toMap(id -> id, keycloakService::getUserProfile));

        List<GetAllEmergencyRequestsResponse> content = requests.stream()
                .map(r -> mapToResponse(r, profiles))
                .toList();

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }
}
