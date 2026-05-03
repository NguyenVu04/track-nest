package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyadmin.impl.datatype.GetAllEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyadmin.service.EmergencyAdminService;

@RestController
@RequestMapping("/emergency-admin")
@RequiredArgsConstructor
public class EmergencyAdminController {

    private final EmergencyAdminService service;

    /**
     * GET /emergency-admin/requests
     *
     * Returns all emergency requests regardless of which emergency service they are
     * assigned to and regardless of who sent them. Intended for admin use only.
     *
     * Query params:
     *   status  – optional filter (PENDING | ACCEPTED | REJECTED | CLOSED)
     *   page    – 0-indexed page number (default 0)
     *   size    – page size (default 20)
     */
    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetAllEmergencyRequestsResponse>> getAllEmergencyRequests(
            @RequestParam(name = "status", required = false) EmergencyRequestStatus.Status status,
            Pageable pageable
    ) {
        PageResponse<GetAllEmergencyRequestsResponse> response =
                service.getAllEmergencyRequests(status, pageable);

        return ResponseEntity.ok(response);
    }
}
