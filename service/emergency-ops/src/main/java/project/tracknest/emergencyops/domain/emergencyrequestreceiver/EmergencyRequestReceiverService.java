package project.tracknest.emergencyops.domain.emergencyrequestreceiver;

import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.GetTrackerEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestResponse;

import java.util.List;
import java.util.UUID;

public interface EmergencyRequestReceiverService {
    PostEmergencyRequestResponse postEmergencyRequest(UUID userId, PostEmergencyRequestRequest request);
    List<GetTrackerEmergencyRequestResponse> getTrackerEmergencyRequests(UUID userId);
}
