package project.tracknest.emergencyops.domain.emergencyresponder.service;

import project.tracknest.emergencyops.core.datatype.LocationMessage;

import java.util.UUID;

public interface EmergencyResponderSubscriber {
    void receiveLocationMessage(UUID receiverId, LocationMessage message);
}
