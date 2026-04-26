package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;

import java.util.UUID;

public interface EmergencyResponderEmergencyServiceUserRepository extends JpaRepository<EmergencyServiceUser, UUID> {
    Page<EmergencyServiceUser> findByEmergencyService_Id(UUID serviceId, Pageable pageable);
}
