package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.safezonemanager.SafeZoneManagerService;

@RestController
@RequestMapping("/safe-zone-manager")
@RequiredArgsConstructor
public class SafeZoneManagerController {
    private final SafeZoneManagerService service;
}
