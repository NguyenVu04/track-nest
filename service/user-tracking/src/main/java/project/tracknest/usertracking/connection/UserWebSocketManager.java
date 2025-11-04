package project.tracknest.usertracking.connection;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import project.tracknest.usertracking.configuration.UserSessionRegistry;

import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class UserWebSocketManager implements UserConnectionManager {
    private final UserSessionRegistry userSessionRegistry;

    public UserWebSocketManager(UserSessionRegistry userSessionRegistry) {
        this.userSessionRegistry = userSessionRegistry;
    }

    @Override
    public void sendMessage(UUID userId, String topic, String message) {
        String id = userId.toString();

        Set<WebSocketSession> sessions = userSessionRegistry.getSessions(id);

        for (var session : sessions) {
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(topic + ":" + message));
                } catch (Exception e) {
                    log.error("Failed to send message to user {}: {}", userId, e.getMessage());
                }
            }
        }
        userSessionRegistry.removeClosedSessions(id);
    }
}
