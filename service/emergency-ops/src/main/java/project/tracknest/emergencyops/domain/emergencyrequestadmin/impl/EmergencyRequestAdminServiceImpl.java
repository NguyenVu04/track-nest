package project.tracknest.emergencyops.domain.emergencyrequestadmin.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakEmergencyServiceProfile;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.service.EmergencyRequestAdminService;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestAdminServiceImpl implements EmergencyRequestAdminService {
    private final EmergencyRequestAdminEmergencyRequestRepository emergencyRequestRepository;
    private final KeycloakService keycloakService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GetEmergencyRequestsResponse> getEmergencyRequests(EmergencyRequestStatus.Status status, Pageable pageable) {
        String statusValue = status != null ? status.getValue() : null;

        Page<EmergencyRequest> page = emergencyRequestRepository.findAllEmergencyRequests(statusValue, pageable);
        List<EmergencyRequest> requests = page.getContent();

        Set<UUID> userIds = requests.stream()
                .flatMap(r -> Stream.of(r.getSenderId(), r.getTargetId()))
                .collect(Collectors.toSet());
        Map<UUID, KeycloakUserProfile> userProfiles = userIds.parallelStream()
                .collect(Collectors.toMap(id -> id, keycloakService::getUserProfile));

        Set<UUID> serviceIds = requests.stream()
                .map(r -> r.getEmergencyService().getId())
                .collect(Collectors.toSet());
        Map<UUID, KeycloakEmergencyServiceProfile> serviceProfiles = serviceIds.parallelStream()
                .collect(Collectors.toMap(id -> id, keycloakService::getEmergencyServiceProfile));

        List<GetEmergencyRequestsResponse> content = requests.stream()
                .map(r -> mapToResponse(r, userProfiles, serviceProfiles))
                .toList();

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    private GetEmergencyRequestsResponse mapToResponse(
            EmergencyRequest request,
            Map<UUID, KeycloakUserProfile> userProfiles,
            Map<UUID, KeycloakEmergencyServiceProfile> serviceProfiles
    ) {
        KeycloakUserProfile sender = userProfiles.get(request.getSenderId());
        KeycloakUserProfile target = userProfiles.get(request.getTargetId());
        KeycloakEmergencyServiceProfile service = serviceProfiles.get(request.getEmergencyService().getId());

        return GetEmergencyRequestsResponse.builder()
                .id(request.getId())
                .senderId(request.getSenderId())
                .senderUsername(sender.username())
                .senderFirstName(sender.firstName())
                .senderLastName(sender.lastName())
                .senderPhoneNumber(sender.phoneNumber())
                .senderEmail(sender.email())
                .senderAvatarUrl(sender.avatarUrl())
                .targetId(request.getTargetId())
                .targetUsername(target.username())
                .targetFirstName(target.firstName())
                .targetLastName(target.lastName())
                .targetPhoneNumber(target.phoneNumber())
                .targetEmail(target.email())
                .targetAvatarUrl(target.avatarUrl())
                .openedAt(request.getOpenAt().toInstant().toEpochMilli())
                .closedAt(request.getCloseAt() != null ? request.getCloseAt().toInstant().toEpochMilli() : null)
                .status(request.getStatus().getName())
                .targetLastLatitude(request.getLatitude())
                .targetLastLongitude(request.getLongitude())
                .serviceId(service.id())
                .serviceUsername(service.username())
                .servicePhoneNumber(service.phoneNumber())
                .serviceEmail(service.email())
                .build();
    }
}
