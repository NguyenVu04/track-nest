package project.tracknest.usertracking.configuration.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerRedisMessagePublisher {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final StringRedisTemplate redisTemplate;
    private final GrpcSessionService sessionService;

    public void publishMessage(ServerRedisMessage message, UUID sessionId) {
        try {
            GrpcSession session = sessionService.getSession(sessionId);
            Set<String> serverIds = session.serverIds();

            if (serverIds.isEmpty()) {
                log.info("No active servers for session {}. Message will not be published: {}", sessionId, message);
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
}
