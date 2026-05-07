package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.service.EmergencyRequestAdminService;

@RestController
@RequestMapping("/emergency-request-admin")
@RequiredArgsConstructor
public class EmergencyRequestAdminController {
    private final EmergencyRequestAdminService service;

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetEmergencyRequestsResponse>> getEmergencyRequests(
            @RequestParam(name = "status", required = false)
            EmergencyRequestStatus.Status status,

            Pageable pageable
    ) {
        PageResponse<GetEmergencyRequestsResponse> response = service.getEmergencyRequests(status, pageable);

        return ResponseEntity.ok(response);
    }
}
