package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessage;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessagePublisher;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.LocationMessage;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;
import project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype.GetEmergencyServiceTargetsResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderService;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderSubscriber;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyResponderServiceImpl implements EmergencyResponderService, LocationMessageConsumer, EmergencyResponderSubscriber {
    private final SimpMessagingTemplate messagingTemplate;
    private final KeycloakService keycloakService;
    private final ServerRedisMessagePublisher redisPublisher;
    private final EmergencyResponderEmergencyServiceUserRepository emergencyServiceUserRepository;
    @Value("${app.stomp.queue.user-location}")
    private String userLocationQueue;

    @Override
    @Transactional
    public void trackTaget(LocationMessage message) {
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

        ServerRedisMessage redisMessage = ServerRedisMessage
                .builder()
                .payload(message)
                .method("receiveLocationMessage")
                .receiverId(emergencyServiceUser
                        .getEmergencyService()
                        .getId())
                .build();

        redisPublisher.publishMessage(redisMessage, message.userId());
        log.info("Tracking location for user {}", emergencyServiceUser.getUserId());
    }

    @Override
    public void receiveLocationMessage(UUID receiverId, Object message) {
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                userLocationQueue,
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
