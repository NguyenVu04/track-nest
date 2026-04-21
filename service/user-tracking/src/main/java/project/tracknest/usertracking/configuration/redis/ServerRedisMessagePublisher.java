package project.tracknest.usertracking.configuration.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.configuration.firebase.FcmService;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerRedisMessagePublisher {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String FAMILY_MESSAGE_METHOD = "receiveFamilyMessage";
    private static final String FAMILY_MESSAGE_NOTIFICATION_TITLE = "New Message from Family";
    private static final String FAMILY_MESSAGE_NOTIFICATION_BODY = "Open the app to read your latest family message.";

    private final StringRedisTemplate redisTemplate;
    private final GrpcSessionService sessionService;
    private final FcmService fcmService;
    private final ServerPublisherMobileDeviceRepository mobileDeviceRepository;

    public void publishMessage(ServerRedisMessage message, UUID sessionId, boolean notifyOffline) {
        try {
            GrpcSession session = sessionService.getSession(sessionId);
            Set<String> serverIds = session.serverIds();

            if (serverIds.isEmpty()) {
                log.info("No active servers for session {}. Message will not be published: {}", sessionId, message);
                if (notifyOffline) {
                    sendFcmFallback(message, sessionId);
                }
                return;
            }

            String json = OBJECT_MAPPER.writeValueAsString(message);
            for (String server : serverIds) {
                redisTemplate.convertAndSend(server, json);
            }

        } catch (Exception e) {
            log.error("Failed to publish message to Redis: {}", message, e);
            throw new RuntimeException("Failed to publish message to Redis", e);
        }
    }

    private void sendFcmFallback(ServerRedisMessage message, UUID userId) {
        if (!FAMILY_MESSAGE_METHOD.equals(message.getMethod())) {
            return;
        }

        try {
            List<String> tokens = mobileDeviceRepository.findAllByUserId(userId)
                    .stream()
                    .map(MobileDevice::getDeviceToken)
                    .toList();

            if (tokens.isEmpty()) {
                log.info("No device tokens found for offline user {}. Skipping FCM notification.", userId);
                return;
            }

            fcmService.sendToTokens(tokens, FAMILY_MESSAGE_NOTIFICATION_TITLE, FAMILY_MESSAGE_NOTIFICATION_BODY);
            log.info("Sent FCM fallback notification to {} device(s) for offline user {}", tokens.size(), userId);
        } catch (Exception e) {
            log.error("Failed to send FCM fallback for user {}: {}", userId, e.getMessage(), e);
        }
    }
}
