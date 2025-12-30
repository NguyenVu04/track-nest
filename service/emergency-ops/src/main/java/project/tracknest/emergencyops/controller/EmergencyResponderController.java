package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.emergencyresponder.EmergencyResponderService;

@RestController
@RequestMapping("/emergency-responder")
@RequiredArgsConstructor
public class EmergencyResponderController {
    private final EmergencyResponderService service;
}
