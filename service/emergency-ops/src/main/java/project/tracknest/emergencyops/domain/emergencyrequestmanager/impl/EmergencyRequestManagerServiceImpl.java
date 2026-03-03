package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.AcceptEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.CloseEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.RejectEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestManagerServiceImpl implements EmergencyRequestManagerService {
    @Override
    public List<GetEmergencyRequestsResponse> getEmergencyRequests(UUID userId, PageRequest request) {
        return List.of();
    }

    @Override
    public AcceptEmergencyRequestResponse acceptEmergencyRequest(UUID userId, UUID requestId) {
        return null;
    }

    @Override
    public RejectEmergencyRequestResponse rejectEmergencyRequest(UUID userId, UUID requestId) {
        return null;
    }

    @Override
    public CloseEmergencyRequestResponse closeEmergencyRequest(UUID userId, UUID requestId) {
        return null;
    }
}
