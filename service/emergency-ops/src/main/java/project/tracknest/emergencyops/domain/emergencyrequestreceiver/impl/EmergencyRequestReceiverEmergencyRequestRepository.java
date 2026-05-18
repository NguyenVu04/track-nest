package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;

import java.util.Optional;
import java.util.UUID;

interface EmergencyRequestReceiverEmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {

    Page<EmergencyRequest> findBySenderId(UUID senderId, Pageable pageable);

    @Query("SELECT er FROM EmergencyRequest er WHERE er.targetId = :targetId AND er.status.name IN ('PENDING', 'ACCEPTED')")
    Optional<EmergencyRequest> findActiveByTargetId(@Param("targetId") UUID targetId);
}
