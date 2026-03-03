package project.tracknest.emergencyops.domain.safezonemanager.service;

import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;

import java.util.UUID;

public interface SafeZoneManagerService {
    PostSafeZoneResponse createSafeZone(UUID serviceId, PostSafeZoneRequest request);

    PageResponse<GetServiceSafeZonesResponse> retrieveServiceSafeZones(UUID serviceId, String nameFilter, Pageable pageable);

    PutSafeZoneResponse updateSafeZone(UUID serviceId, UUID safeZoneId, PutSafeZoneRequest request);

    DeleteSafeZoneResponse deleteSafeZone(UUID serviceId, UUID safeZoneId);
}
