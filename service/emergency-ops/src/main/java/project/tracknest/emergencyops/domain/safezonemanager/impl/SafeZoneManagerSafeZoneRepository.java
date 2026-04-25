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
    @Query(
            value = """
        SELECT sz.* FROM safe_zone sz
        WHERE sz.emergency_service_id = :serviceId
            AND (CAST(:nameFilter AS text) IS NULL OR LOWER(sz.name) LIKE LOWER(CONCAT('%', CAST(:nameFilter AS text), '%')) ESCAPE '\\')
        """,
            countQuery = """
        SELECT count(*) FROM safe_zone sz
        WHERE sz.emergency_service_id = :serviceId
            AND (CAST(:nameFilter AS text) IS NULL OR LOWER(sz.name) LIKE LOWER(CONCAT('%', CAST(:nameFilter AS text), '%')) ESCAPE '\\')
        """,
            nativeQuery = true
    )
    Page<SafeZone> findByEmergencyService_Id(
            @Param("serviceId") UUID serviceId,
            @Param("nameFilter") String nameFilter,
            Pageable pageable);

    Optional<SafeZone> findByIdAndEmergencyService_Id(UUID id, UUID serviceId);
}
