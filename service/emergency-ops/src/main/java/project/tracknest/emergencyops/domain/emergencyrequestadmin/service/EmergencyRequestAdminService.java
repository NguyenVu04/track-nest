package project.tracknest.emergencyops.domain.emergencyrequestadmin.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype.GetEmergencyRequestsResponse;

public interface EmergencyRequestAdminService {
    PageResponse<GetEmergencyRequestsResponse> getEmergencyRequests(EmergencyRequestStatus.Status status, Pageable pageable);
}
