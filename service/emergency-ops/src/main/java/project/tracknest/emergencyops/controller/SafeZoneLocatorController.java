package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.safezonelocator.SafeZoneLocatorService;

@RestController
@RequestMapping("safe-zone-locator")
@RequiredArgsConstructor
public class SafeZoneLocatorController {
    private final SafeZoneLocatorService service;
}
