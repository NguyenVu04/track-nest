package project.tracknest.emergencyops.domain.safezonelocator.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.core.entity.SafeZone;
import project.tracknest.emergencyops.domain.safezonelocator.impl.datatype.GetNearestSafeZonesResponse;
import project.tracknest.emergencyops.domain.safezonelocator.service.SafeZoneLocatorService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
class SafeZoneLocatorServiceImpl implements SafeZoneLocatorService {
    private final SafeZoneLocatorSafeZoneRepository safeZoneRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GetNearestSafeZonesResponse> retrieveNearestSafeZones(
            double latitudeDegrees,
            double longitudeDegrees,
            float maxDistanceMeters,
            int maxNumberOfSafeZones
    ) {
        Pageable pageable = Pageable.ofSize(maxNumberOfSafeZones);

        Slice<SafeZone> safeZoneSlice = safeZoneRepository.findNearestSafeZones(
                latitudeDegrees,
                longitudeDegrees,
                maxDistanceMeters,
                pageable
        );

        return safeZoneSlice
                .map(safeZone -> GetNearestSafeZonesResponse.builder()
                        .safeZoneId(safeZone.getId())
                        .safeZoneName(safeZone.getName())
                        .latitudeDegrees(safeZone.getLatitude())
                        .longitudeDegrees(safeZone.getLatitude())
                        .radiusMeters(safeZone.getRadius())
                        .build()
                )
                .toList();
    }
}
