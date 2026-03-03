package project.tracknest.emergencyops.domain.emergencyrequestmanager.service;

import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.AcceptEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.CloseEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.RejectEmergencyRequestResponse;

import java.util.List;
import java.util.UUID;

public interface EmergencyRequestManagerService {
    List<GetEmergencyRequestsResponse> getEmergencyRequests(UUID userId, PageRequest request);

    AcceptEmergencyRequestResponse acceptEmergencyRequest(UUID userId, UUID requestId);

    RejectEmergencyRequestResponse rejectEmergencyRequest(UUID userId, UUID requestId);

    CloseEmergencyRequestResponse closeEmergencyRequest(UUID userId, UUID requestId);
}
