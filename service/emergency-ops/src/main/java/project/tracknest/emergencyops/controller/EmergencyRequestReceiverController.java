package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.EmergencyRequestReceiverService;

@RestController
@RequestMapping("/emergency-request-receiver")
@RequiredArgsConstructor
public class EmergencyRequestReceiverController {
    private final EmergencyRequestReceiverService service;
}
