package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.LocationMessage;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;
import project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype.GetEmergencyServiceTargetsResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderService;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyResponderServiceImpl implements EmergencyResponderService, LocationMessageConsumer {
    private final SimpMessagingTemplate messagingTemplate;
    private final KeycloakService keycloakService;

    private final EmergencyResponderEmergencyServiceUserRepository emergencyServiceUserRepository;

    @Override
    @Transactional
    public void trackTaget(LocationMessage message) {
        //TODO: add Redis pub/sub
        Optional<EmergencyServiceUser> emergencyServiceUserOpt = emergencyServiceUserRepository
                .findById(message.userId());

        if (emergencyServiceUserOpt.isEmpty()) {
            log.info("User {} is not being tracked by Emergency Service", message.userId());
            return;
        }

        EmergencyServiceUser emergencyServiceUser = emergencyServiceUserOpt.get();
        emergencyServiceUser.setLastLatitude(message.latitudeDeg());
        emergencyServiceUser.setLastLongitude(message.longitudeDeg());
        emergencyServiceUser.setLastUpdateTime(
                Instant.ofEpochMilli(
                        message.timestampMs()
                ).atOffset(ZoneOffset.UTC)
        );
        emergencyServiceUserRepository.save(emergencyServiceUser);
        log.info("Tracking location for user {}", emergencyServiceUser.getUserId());

        messagingTemplate.convertAndSendToUser(
                emergencyServiceUser.getEmergencyService()
                        .getId()
                        .toString(),
                "/queue/location",
                message);
    }

    private GetEmergencyServiceTargetsResponse mapToGetEmergencyServiceTargetsResponse(
            EmergencyServiceUser user
    ) {
        KeycloakUserProfile profile = keycloakService.getUserProfile(user.getUserId());
        return new GetEmergencyServiceTargetsResponse(
                user.getUserId(),
                profile.username(),
                profile.firstName(),
                profile.lastName(),
                profile.email(),
                profile.phoneNumber(),
                profile.avatarUrl(),
                user.getLastLatitude(),
                user.getLastLongitude(),
                user.getLastUpdateTime()
                        .toInstant()
                        .toEpochMilli()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GetEmergencyServiceTargetsResponse> retrieveEmergencyServiceTargets(
            UUID userId,
            Pageable pageable
    ) {
        Page<EmergencyServiceUser> page = emergencyServiceUserRepository
                .findByEmergencyService_Id(userId, pageable);

        List<GetEmergencyServiceTargetsResponse> content = page
                .getContent()
                .stream()
                .map(this::mapToGetEmergencyServiceTargetsResponse)
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
