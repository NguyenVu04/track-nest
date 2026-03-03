package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.EmergencyRequestReceiverService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.GetTrackerEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype.PostEmergencyRequestResponse;

@RestController
@RequestMapping("/emergency-request-receiver")
@RequiredArgsConstructor
public class EmergencyRequestReceiverController {
    private final EmergencyRequestReceiverService service;

    @PostMapping("/request")
    public ResponseEntity<PostEmergencyRequestResponse> postEmergencyRequest(
            PostEmergencyRequestRequest request
    ) {
        // TODO: implementation here
        return ResponseEntity.ok().build();
    }

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<GetTrackerEmergencyRequestResponse>> getTrackerEmergencyRequests(
            PageRequest request
    ) {
        // TODO: implementation here
        return ResponseEntity.ok().build();
    }
}
