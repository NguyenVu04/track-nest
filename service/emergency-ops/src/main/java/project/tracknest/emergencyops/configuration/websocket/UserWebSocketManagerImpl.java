package project.tracknest.emergencyops.configuration.websocket;

import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserWebSocketManagerImpl implements UserConnectionManager {
    private final UserSessionRegistry userSessionRegistry;
    private final JsonMapper MAPPER = new JsonMapper();

    @Override
    public void sendMessage(UUID userId, String topic, Object message) {
        String id = userId.toString();

        Set<WebSocketSessionContainer> sessions = userSessionRegistry.getSessions(id);

        for (var session : sessions) {
            if (session.isClose()) {
                log.warn("WebSocket session is closed for user {}", userId);
                continue;
            }

            try {
                String messagePayload = MAPPER.writeValueAsString(
                        new WebSocketTextMessage(
                                topic,
                                WebSocketMessageType.MESSAGE,
                                message));

                session.sendMessage(topic, new TextMessage(messagePayload));
            } catch (Exception e) {
                log.error("Failed to send message to user {}: {}", userId, e.getMessage());
            }
        }

        userSessionRegistry.removeClosedSessions(id);
    }
}
