package project.tracknest.emergencyops.domain.emergencyrequestreceiver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.GetTrackerEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestResponse;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class EmergencyRequestReceiverServiceImpl implements EmergencyRequestReceiverService {
    @Override
    public PostEmergencyRequestResponse postEmergencyRequest(UUID userId, PostEmergencyRequestRequest request) {
        return null;
    }

    @Override
    public List<GetTrackerEmergencyRequestResponse> getTrackerEmergencyRequests(UUID userId) {
        return List.of();
    }
}
