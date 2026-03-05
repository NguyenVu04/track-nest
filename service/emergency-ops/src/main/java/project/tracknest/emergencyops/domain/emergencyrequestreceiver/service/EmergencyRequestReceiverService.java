package project.tracknest.emergencyops.domain.emergencyrequestreceiver.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.GetTrackerEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestResponse;

import java.util.UUID;

public interface EmergencyRequestReceiverService {
    PostEmergencyRequestResponse createEmergencyRequest(UUID userId, PostEmergencyRequestRequest request);
    PageResponse<GetTrackerEmergencyRequestsResponse> retrieveTrackerEmergencyRequests(UUID userId, Pageable pageable);
}
