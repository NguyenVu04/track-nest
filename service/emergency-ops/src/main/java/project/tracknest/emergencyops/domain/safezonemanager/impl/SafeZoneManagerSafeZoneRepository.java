package project.tracknest.emergencyops.domain.safezonemanager.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.emergencyops.core.entity.SafeZone;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface SafeZoneManagerSafeZoneRepository extends JpaRepository<SafeZone, UUID> {
    @Query("""
    SELECT sz FROM SafeZone sz
    WHERE sz.emergencyService.id = :serviceId
        AND (:nameFilter IS NULL OR LOWER(sz.name) LIKE LOWER(CONCAT('%', :nameFilter, '%')))
    """)
    Page<SafeZone> findByEmergencyService_Id(
            @Param("serviceId") UUID serviceId,
            @Param("nameFilter") String nameFilter,
            Pageable pageable);

    Optional<SafeZone> findByIdAndEmergencyService_Id(UUID id, UUID serviceId);
}
