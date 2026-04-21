package project.tracknest.usertracking.configuration.redis;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.List;
import java.util.UUID;

interface ServerPublisherMobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {
    List<MobileDevice> findAllByUserId(UUID userId);
}
