package project.tracknest.emergencyops.domain.safezonelocator.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.tracknest.emergencyops.core.entity.SafeZone;

import java.util.UUID;

public interface SafeZoneLocatorSafeZoneRepository extends JpaRepository<SafeZone, UUID> {

    @Query(value =
            "SELECT * FROM safe_zone sz " +
                    "WHERE ST_DWithin(sz.geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius) " +
                    "ORDER BY s.created_at DESC ",
            nativeQuery = true
    )
    Slice<SafeZone> findNearestSafeZones(
            double latitude,
            double longitude,
            float radius,
            Pageable pageable
    );
}
