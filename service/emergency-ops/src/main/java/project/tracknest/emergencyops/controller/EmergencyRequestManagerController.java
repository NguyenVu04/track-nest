package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.EmergencyRequestManagerService;

@RestController
@RequestMapping("/emergency-request-manager")
@RequiredArgsConstructor
public class EmergencyRequestManagerController {
    private final EmergencyRequestManagerService service;
}
