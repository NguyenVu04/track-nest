package project.tracknest.usertracking.connection;

import java.util.UUID;

public interface UserConnectionManager {
    void sendMessage(UUID userId, String topic, Object message);
}
