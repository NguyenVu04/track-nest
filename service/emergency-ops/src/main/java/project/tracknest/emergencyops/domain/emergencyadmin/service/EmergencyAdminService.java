package project.tracknest.emergencyops.domain.emergencyadmin.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyadmin.impl.datatype.GetAllEmergencyRequestsResponse;

public interface EmergencyAdminService {
    PageResponse<GetAllEmergencyRequestsResponse> getAllEmergencyRequests(
            EmergencyRequestStatus.Status status,
            Pageable pageable
    );
}
