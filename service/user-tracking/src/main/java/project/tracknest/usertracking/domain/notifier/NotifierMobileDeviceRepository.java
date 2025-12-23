package project.tracknest.usertracking.domain.notifier;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.UUID;

interface NotifierMobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {
    void deleteMobileDeviceByIdAndUserId(UUID id, UUID userId);
}
