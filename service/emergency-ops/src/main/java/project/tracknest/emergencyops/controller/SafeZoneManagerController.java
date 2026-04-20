package project.tracknest.emergencyops.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.safezonemanager.service.SafeZoneManagerService;

import java.util.UUID;

import static project.tracknest.emergencyops.configuration.security.SecurityUtils.getCurrentUserId;

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
        UUID serviceId = getCurrentUserId();

        PostSafeZoneResponse response = service.createSafeZone(serviceId, request);

        return ResponseEntity
                .ok(response);
    }

    @GetMapping("/safe-zones")
    public ResponseEntity<PageResponse<GetServiceSafeZonesResponse>> getServiceSafeZones(
            @RequestParam(name = "nameFilter", required = false)
            @Size(max = 100, message = "Name filter must be at most 100 characters")
            String nameFilter,

            Pageable pageable
    ) {
        UUID serviceId = getCurrentUserId();

        PageResponse<GetServiceSafeZonesResponse> response = service
                .retrieveServiceSafeZones(
                        serviceId,
                        nameFilter,
                        pageable);

        return ResponseEntity
                .ok(response);
    }

    @PutMapping("/safe-zone/{safeZoneId}")
    public ResponseEntity<PutSafeZoneResponse> updateSafeZone(
            @PathVariable UUID safeZoneId,
            @Valid @RequestBody PutSafeZoneRequest request
    ) {
        UUID serviceId = getCurrentUserId();

        PutSafeZoneResponse response = service.updateSafeZone(serviceId, safeZoneId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/safe-zone/{safeZoneId}")
    public ResponseEntity<DeleteSafeZoneResponse> deleteSafeZone(
            @PathVariable UUID safeZoneId
    ) {
        UUID serviceId = getCurrentUserId();

        DeleteSafeZoneResponse response = service.deleteSafeZone(serviceId, safeZoneId);

        return ResponseEntity.ok(response);
    }
}
