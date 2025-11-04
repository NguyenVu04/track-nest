package project.tracknest.usertracking.connection;

import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import project.tracknest.usertracking.configuration.UserSessionRegistry;
import project.tracknest.usertracking.core.WebSocketTextMessage;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class UserWebSocketManagerImpl implements UserConnectionManager {
    private final UserSessionRegistry userSessionRegistry;
    private final JsonMapper MAPPER = new JsonMapper();

    public UserWebSocketManagerImpl(UserSessionRegistry userSessionRegistry) {
        this.userSessionRegistry = userSessionRegistry;
    }

    @Override
    public void sendMessage(UUID userId, String topic, Object message) {
        String id = userId.toString();

        Set<WebSocketSession> sessions = userSessionRegistry.getSessions(id);

        for (var session : sessions) {
            if (session == null || !session.isOpen()) {
                log.warn("WebSocket session is closed or null for user {}", userId);
                continue;
            }

            try {
                String content = MAPPER.writeValueAsString(message);

                String messagePayload = MAPPER.writeValueAsString(
                        new WebSocketTextMessage(topic, content));

                session.sendMessage(new TextMessage(messagePayload));
            } catch (Exception e) {
                log.error("Failed to send message to user {}: {}", userId, e.getMessage());
            }
        }

        userSessionRegistry.removeClosedSessions(id);
    }
}
