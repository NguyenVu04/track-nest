package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;

import java.util.Optional;
import java.util.UUID;

interface EmergencyRequestManagerEmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {
    Optional<EmergencyRequest> findByIdAndEmergencyService_Id(UUID id, UUID serviceId);

    @Query("""
    SELECT er
    FROM EmergencyRequest er
    WHERE er.emergencyService.id = :serviceId
      AND (:status IS NULL OR er.status.name = :status)
    """)
    Page<EmergencyRequest> findServiceEmergencyRequests(
        @Param("serviceId") UUID serviceId,
        @Param("status") String status,
        Pageable pageable
    );

    @Query("""
    SELECT COUNT(er)
    FROM EmergencyRequest er
    WHERE er.emergencyService.id = :serviceId
      AND :status IS NULL OR er.status.name = :status
    """)
    long countEmergencyRequests(
            @Param("serviceId") UUID serviceId,
            @Param("status") String status
    );
}
