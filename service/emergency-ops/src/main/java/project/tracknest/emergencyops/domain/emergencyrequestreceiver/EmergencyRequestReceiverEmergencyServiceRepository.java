package project.tracknest.emergencyops.domain.emergencyrequestreceiver;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.util.Optional;
import java.util.UUID;

public interface EmergencyRequestReceiverEmergencyServiceRepository extends JpaRepository<EmergencyService, UUID> {

    @Query(value = """
    SELECT es.*
    FROM emergency_service es
    WHERE es.geom IS NOT NULL
    ORDER BY ST_Distance(es.geom::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography)
    LIMIT 1
    """, nativeQuery = true)
    Optional<EmergencyService> findNearestEmergencyService(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude
    );
}
