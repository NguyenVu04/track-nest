package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.configuration.security.SecurityUtils;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype.GetEmergencyServiceTargetsResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderService;

import java.util.UUID;

import static project.tracknest.emergencyops.configuration.security.SecurityUtils.getCurrentUserId;

@RestController
@RequestMapping("/emergency-responder")
@RequiredArgsConstructor
public class EmergencyResponderController {
    private final EmergencyResponderService service;

    @GetMapping("/targets")
    public ResponseEntity<PageResponse<GetEmergencyServiceTargetsResponse>> getEmergencyServiceTargets(
            Pageable pageable
    ) {
        UUID serviceId = getCurrentUserId();

        PageResponse<GetEmergencyServiceTargetsResponse> response = service
                .retrieveEmergencyServiceTargets(serviceId, pageable);

        return ResponseEntity.ok(response);
    }
}
