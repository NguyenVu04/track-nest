package project.tracknest.emergencyops.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.safezonemanager.service.SafeZoneManagerService;

@RestController
@RequestMapping("/safe-zone-manager")
@RequiredArgsConstructor
@Validated
public class SafeZoneManagerController {
    private final SafeZoneManagerService service;

    @PostMapping("/safe-zone")
    public ResponseEntity<PostSafeZoneResponse> postSafeZone(
            @Valid @RequestBody PostSafeZoneRequest request
    ) {

        //TODO: implement the logic to create a safe zone and return the response
        return ResponseEntity.ok().build();
    }

    @GetMapping("/safe-zone")
    public ResponseEntity<PageResponse<GetServiceSafeZoneResponse>> getServiceSafeZones(
            @RequestParam(name = "pageSize")
            @Size(min = 1, max = 256, message = "Page size must be between 1 and 256")
            int pageSize,

            @RequestParam(name = "pageToken") String pageToken
    ) {
        // TODO: implement the logic to get the safe zones for a service and return the response
        return ResponseEntity.ok().build();
    }

    @PutMapping("/safe-zone/{safeZoneId}")
    public ResponseEntity<PutSafeZoneResponse> updateSafeZone(
            @PathVariable("safeZoneId") String safeZoneId,
            @Valid @RequestBody PostSafeZoneRequest request
    ) {
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/safe-zone/{safeZoneId}")
    public ResponseEntity<DeleteSafeZoneResponse> deleteSafeZone(
            @PathVariable("safeZoneId") String safeZoneId
    ) {
        return ResponseEntity.ok().build();
    }
}
