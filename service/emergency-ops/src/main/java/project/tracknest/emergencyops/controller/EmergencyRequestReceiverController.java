package project.tracknest.emergencyops.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.DeleteEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.GetTrackerEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestResponse;

import java.util.UUID;

import static project.tracknest.emergencyops.configuration.security.SecurityUtils.getCurrentUserId;

@RestController
@RequestMapping("/emergency-request-receiver")
@RequiredArgsConstructor
public class EmergencyRequestReceiverController {
    private final EmergencyRequestReceiverService service;

    @PostMapping("/request")
    public ResponseEntity<PostEmergencyRequestResponse> postEmergencyRequest(
            @Valid
            @RequestBody
            PostEmergencyRequestRequest request
    ) {
        UUID userId = getCurrentUserId();

        PostEmergencyRequestResponse response = service.createEmergencyRequest(userId, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetTrackerEmergencyRequestsResponse>> getTrackerEmergencyRequests(
            Pageable pageable
    ) {
        UUID userId = getCurrentUserId();

        PageResponse<GetTrackerEmergencyRequestsResponse> response = service.retrieveTrackerEmergencyRequests(userId, pageable);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<DeleteEmergencyRequestResponse> deleteEmergencyRequest(
            @PathVariable UUID requestId
    ) {
        UUID userId = getCurrentUserId();

        DeleteEmergencyRequestResponse response = service.deleteEmergencyRequest(userId, requestId);

        return ResponseEntity.ok(response);
    }
}
