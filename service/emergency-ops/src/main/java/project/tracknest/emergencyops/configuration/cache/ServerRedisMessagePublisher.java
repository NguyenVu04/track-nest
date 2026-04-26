package project.tracknest.emergencyops.configuration.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.configuration.websocket.WebSocketSession;
import project.tracknest.emergencyops.configuration.websocket.WebSocketSessionService;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerRedisMessagePublisher {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final StringRedisTemplate redisTemplate;
    private final WebSocketSessionService sessionService;

    public void publishMessage(ServerRedisMessage message, UUID sessionId) {
        try {
            WebSocketSession session = sessionService.getSession(sessionId);
            Set<String> serverIds = session.serverIds();

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
