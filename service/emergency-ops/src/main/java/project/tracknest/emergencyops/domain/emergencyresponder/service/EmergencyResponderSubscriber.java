package project.tracknest.emergencyops.domain.emergencyresponder.service;

import java.util.UUID;

public interface EmergencyResponderSubscriber {
    void receiveLocationMessage(UUID receiverId, Object message);
}
