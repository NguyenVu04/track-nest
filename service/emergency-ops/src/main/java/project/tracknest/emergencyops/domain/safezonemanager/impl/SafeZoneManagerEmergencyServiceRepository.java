package project.tracknest.emergencyops.domain.safezonemanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.util.UUID;

public interface SafeZoneManagerEmergencyServiceRepository extends JpaRepository<EmergencyService, UUID> {
}
