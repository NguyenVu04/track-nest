package project.tracknest.emergencyops.domain.emergencyadmin.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;

import java.util.UUID;

interface EmergencyAdminEmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {

    @Query("""
    SELECT er
    FROM EmergencyRequest er
    WHERE (:status IS NULL OR er.status.name = :status)
    ORDER BY er.openAt DESC
    """)
    Page<EmergencyRequest> findAllEmergencyRequests(
            @Param("status") String status,
            Pageable pageable
    );
}
