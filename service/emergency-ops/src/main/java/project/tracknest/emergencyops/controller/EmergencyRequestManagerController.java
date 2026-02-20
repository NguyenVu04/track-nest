package project.tracknest.emergencyops.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.AcceptEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.CloseEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.core.datatype.PageRequest;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.RejectEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;

import java.util.UUID;

@RestController
@RequestMapping("/emergency-request-manager")
@RequiredArgsConstructor
public class EmergencyRequestManagerController {
    private final EmergencyRequestManagerService service;

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetEmergencyRequestsResponse>> getEmergencyRequests(
            @RequestBody @Valid PageRequest request
    ) {
        //TODO: Implementation would go here
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/requests/{requestId}/accept")
    public ResponseEntity<AcceptEmergencyRequestResponse> acceptEmergencyRequest(
            @PathVariable("requestId") UUID requestId
    ) {
        //TODO: Implementation would go here
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/requests/{requestId}/reject")
    public ResponseEntity<RejectEmergencyRequestResponse> rejectEmergencyRequest(
            @PathVariable("requestId") UUID requestId
    ) {
        //TODO: Implementation would go here
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/requests/{requestId}/close")
    public ResponseEntity<CloseEmergencyRequestResponse> closeEmergencyRequest(
            @PathVariable("requestId") UUID requestId
    ) {
        //TODO: Implementation would go here
        return ResponseEntity.ok().build();
    }
}
