package project.tracknest.emergencyops.configuration.security;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.util.UUID;

public interface SecurityEmergencyServiceRepository extends JpaRepository<EmergencyService, UUID> {
}
