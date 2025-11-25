package project.tracknest.emergencyops.configuration.websocket;

import java.util.UUID;

public interface UserConnectionManager {
    void sendMessage(UUID userId, String topic, Object message);
}
