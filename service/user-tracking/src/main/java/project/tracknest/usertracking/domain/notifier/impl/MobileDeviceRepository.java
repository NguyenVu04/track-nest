package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.Optional;
import java.util.UUID;

interface MobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {
    Optional<MobileDevice> findByIdAndUserId(UUID id, UUID userId);
}
