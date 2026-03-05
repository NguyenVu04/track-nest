package project.tracknest.emergencyops.domain.emergencyrequestreceiver.service;

import java.util.UUID;

public interface EmergencyRequestReceiverSubscriber {
    void receiveEmergencyRequestMessage(UUID receiverId, Object message);
}
