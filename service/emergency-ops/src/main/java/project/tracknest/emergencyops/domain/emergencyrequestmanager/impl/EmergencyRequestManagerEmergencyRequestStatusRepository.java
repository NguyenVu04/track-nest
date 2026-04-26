package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;

interface EmergencyRequestManagerEmergencyRequestStatusRepository extends JpaRepository<EmergencyRequestStatus, String> {
}
