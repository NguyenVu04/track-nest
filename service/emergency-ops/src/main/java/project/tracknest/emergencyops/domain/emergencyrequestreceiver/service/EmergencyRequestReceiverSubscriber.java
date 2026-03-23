package project.tracknest.emergencyops.domain.emergencyrequestreceiver.service;

import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.AssignedEmergencyRequestMessage;

import java.util.UUID;

public interface EmergencyRequestReceiverSubscriber {
    void receiveEmergencyRequestMessage(UUID receiverId, AssignedEmergencyRequestMessage message);
}
