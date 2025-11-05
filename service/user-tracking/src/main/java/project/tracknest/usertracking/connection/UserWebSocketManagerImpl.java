package project.tracknest.usertracking.connection;

import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import project.tracknest.usertracking.configuration.UserSessionRegistry;
import project.tracknest.usertracking.configuration.datatype.WebSocketMessageType;
import project.tracknest.usertracking.configuration.datatype.WebSocketSessionContainer;
import project.tracknest.usertracking.configuration.datatype.WebSocketTextMessage;

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
