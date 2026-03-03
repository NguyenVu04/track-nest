package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.safezonelocator.SafeZoneLocatorService;
import project.tracknest.emergencyops.domain.safezonelocator.datatype.GetNearestSafeZoneResponse;

@RestController
@RequestMapping("safe-zone-locator")
@RequiredArgsConstructor
public class SafeZoneLocatorController {
    private final SafeZoneLocatorService service;

    @GetMapping("/safe-zones/nearest")
    public ResponseEntity<PageResponse<GetNearestSafeZoneResponse>> getNearestSafeZones() {
        return ResponseEntity.ok().build();
    }

}
