package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;

@RestController
@RequestMapping("/emergency-request-manager")
@RequiredArgsConstructor
public class EmergencyRequestManagerController {
    private final EmergencyRequestManagerService service;

    @GetMapping("/requests")
    public ResponseEntity<GetEmergencyRequestsResponse> getEmergencyRequests() {
        //TODO: Implementation would go here
        return ResponseEntity.ok().build();
    }
}
