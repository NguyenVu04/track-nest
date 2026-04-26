package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.util.UUID;

interface EmergencyServiceManagerEmergencyServiceRepository extends JpaRepository<EmergencyService, UUID> {
}
