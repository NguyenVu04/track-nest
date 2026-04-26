package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import org.hibernate.validator.constraints.Range;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.domain.safezonelocator.impl.datatype.GetNearestSafeZonesResponse;
import project.tracknest.emergencyops.domain.safezonelocator.service.SafeZoneLocatorService;

import java.util.List;

@RestController
@RequestMapping("safe-zone-locator")
@RequiredArgsConstructor
@Validated
public class SafeZoneLocatorController {
    private final SafeZoneLocatorService service;

    @GetMapping("/safe-zones/nearest")
    public ResponseEntity<List<GetNearestSafeZonesResponse>> getNearestSafeZones(
            @RequestParam("latitudeDegrees")
            @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90 degrees")
            double latitudeDegrees,

            @RequestParam("longitudeDegrees")
            @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180 degrees")
            double longitudeDegrees,

            @RequestParam("maxDistanceMeters")
            @Range(min = 0, message = "Max distance must be a non-negative value")
            float maxDistanceMeters,

            @RequestParam("maxNumberOfSafeZones")
            @Range(min = 1, max = 64, message = "Max number of safe zones must be between 1 and 64")
            int maxNumberOfSafeZones
    ) {
        List<GetNearestSafeZonesResponse> response = service
                .retrieveNearestSafeZones(
                        latitudeDegrees,
                        longitudeDegrees,
                        maxDistanceMeters,
                        maxNumberOfSafeZones
                );
        return ResponseEntity.ok(response);
    }

}
