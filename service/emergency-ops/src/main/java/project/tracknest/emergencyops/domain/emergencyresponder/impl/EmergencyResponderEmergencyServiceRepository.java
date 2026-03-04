package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.util.UUID;

public interface EmergencyResponderEmergencyServiceRepository extends JpaRepository<EmergencyService, UUID> {
}
