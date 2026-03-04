package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;

import java.util.Optional;
import java.util.UUID;

public interface EmergencyRequestReceiverEmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {
    Optional<EmergencyRequest> findByIdAndSenderId(UUID id, UUID senderId);

    Page<EmergencyRequest> findBySenderId(UUID senderId, Pageable pageable);
}
