package project.tracknest.emergencyops.domain.emergencyrequestmanager.service;

import project.tracknest.emergencyops.core.datatype.EmergencyStatusMessage;

import java.util.UUID;

public interface EmergencyRequestManagerSubscriber {
    void receiveEmergencyStatusMessage(UUID senderId, EmergencyStatusMessage message);
}
