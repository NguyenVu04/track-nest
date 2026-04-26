package project.tracknest.emergencyops.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.GetEmergencyServiceLocationResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;

import java.util.UUID;

import static project.tracknest.emergencyops.configuration.security.SecurityUtils.getCurrentUserId;

@RestController
@RequestMapping("/emergency-request-manager")
@RequiredArgsConstructor
public class EmergencyRequestManagerController {
    private final EmergencyRequestManagerService service;

    @PatchMapping("/emergency-service/location")
    public ResponseEntity<PatchEmergencyServiceLocationResponse> updateEmergencyServiceLocation(
            @Valid @RequestBody PatchEmergencyServiceLocationRequest request
    ) {
        UUID serviceId = getCurrentUserId();

        PatchEmergencyServiceLocationResponse response = service
                .updateEmergencyServiceLocation(serviceId, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/emergency-service/location")
    public ResponseEntity<GetEmergencyServiceLocationResponse> getEmergencyServiceLocation() {
        UUID serviceId = getCurrentUserId();

        GetEmergencyServiceLocationResponse response = service
                .getEmergencyServiceLocation(serviceId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/count")
    public ResponseEntity<GetRequestCountResponse> getPendingRequestCount(
            @RequestParam(name = "status", required = false)
            EmergencyRequestStatus.Status status
    ) {
        UUID serviceId = getCurrentUserId();

        GetRequestCountResponse response = service
                .getEmergencyRequestCount(serviceId, status);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetEmergencyRequestsResponse>> getEmergencyRequests(
            @RequestParam(name = "status", required = false)
            EmergencyRequestStatus.Status status,

            Pageable pageable
    ) {
        UUID serviceId = getCurrentUserId();

        PageResponse<GetEmergencyRequestsResponse> response = service
                .getEmergencyRequests(serviceId, status, pageable);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/requests/{requestId}/accept")
    public ResponseEntity<AcceptEmergencyRequestResponse> acceptEmergencyRequest(
            @PathVariable UUID requestId
    ) {
        UUID serviceId = getCurrentUserId();

        AcceptEmergencyRequestResponse response = service
                .acceptEmergencyRequest(serviceId, requestId);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/requests/{requestId}/reject")
    public ResponseEntity<RejectEmergencyRequestResponse> rejectEmergencyRequest(
            @PathVariable UUID requestId
    ) {
        UUID serviceId = getCurrentUserId();

        RejectEmergencyRequestResponse response = service
                .rejectEmergencyRequest(serviceId, requestId);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/requests/{requestId}/close")
    public ResponseEntity<CloseEmergencyRequestResponse> closeEmergencyRequest(
            @PathVariable UUID requestId
    ) {
        UUID serviceId = getCurrentUserId();

        CloseEmergencyRequestResponse response = service
                .closeEmergencyRequest(serviceId, requestId);

        return ResponseEntity.ok(response);
    }
}
