package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;

import java.util.Optional;
import java.util.UUID;

interface EmergencyRequestManagerEmergencyServiceUserRepository extends JpaRepository<EmergencyServiceUser, UUID> {
    Optional<EmergencyServiceUser> findByEmergencyService_IdAndUserId(UUID serviceId, UUID userId);
}
