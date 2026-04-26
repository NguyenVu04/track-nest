package project.tracknest.emergencyops.domain.emergencyresponder.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype.GetEmergencyServiceTargetsResponse;

import java.util.UUID;

public interface EmergencyResponderService {
    PageResponse<GetEmergencyServiceTargetsResponse> retrieveEmergencyServiceTargets(UUID userId, Pageable pageable);
}
