package project.tracknest.emergencyops.domain.emergencyrequestmanager.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.GetEmergencyServiceLocationResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.*;

import java.util.UUID;

public interface EmergencyRequestManagerService {
    GetRequestCountResponse getEmergencyRequestCount(UUID userId, EmergencyRequestStatus.Status status);

    PageResponse<GetEmergencyRequestsResponse> getEmergencyRequests(UUID userId, EmergencyRequestStatus.Status status, Pageable pageable);

    AcceptEmergencyRequestResponse acceptEmergencyRequest(UUID userId, UUID requestId);

    RejectEmergencyRequestResponse rejectEmergencyRequest(UUID userId, UUID requestId);

    CloseEmergencyRequestResponse closeEmergencyRequest(UUID userId, UUID requestId);

    PatchEmergencyServiceLocationResponse updateEmergencyServiceLocation(UUID userId, PatchEmergencyServiceLocationRequest request);

    GetEmergencyServiceLocationResponse getEmergencyServiceLocation(UUID userId);
}
