package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;

import java.util.UUID;

interface EmergencyRequestReceiverEmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {

    Page<EmergencyRequest> findBySenderId(UUID senderId, Pageable pageable);

}
