package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;

public interface EmergencyRequestReceiverEmergencyRequestStatusRepository extends JpaRepository<EmergencyRequestStatus, String> {
}
