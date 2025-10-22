package project.tracknest.usertracking.connection;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import project.tracknest.usertracking.configuration.WebSocketConfig;

import java.util.UUID;

public class UserWebSocketManager implements UserConnectionManager {
    private final SimpMessagingTemplate template;

    public UserWebSocketManager(SimpMessagingTemplate template) {
        this.template = template;
    }

    @Override
    public void sendMessage(UUID userId, String topic, String message) {
        String destination = WebSocketConfig.DESTINATION_PREFIX + topic;
        template.convertAndSendToUser(userId.toString(), destination, message);
    }
}
