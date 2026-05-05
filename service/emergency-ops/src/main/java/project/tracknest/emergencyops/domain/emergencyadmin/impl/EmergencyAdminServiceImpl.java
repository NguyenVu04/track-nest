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
            EmergencyRequest request
    ) {
        return new GetAllEmergencyRequestsResponse(
                request.getId(),
                request.getOpenAt().toInstant().toEpochMilli(),
                request.getCloseAt() != null
                        ? request.getCloseAt().toInstant().toEpochMilli()
                        : null,
                request.getSenderId(),
                request.getTargetId(),
                request.getEmergencyService().getId(),
                request.getStatus().getName(),
                request.getLongitude(),
                                request.getLatitude()
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

        System.out.println("Fetched " + page.getNumberOfElements() + " emergency requests from the database");

        List<GetAllEmergencyRequestsResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
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
