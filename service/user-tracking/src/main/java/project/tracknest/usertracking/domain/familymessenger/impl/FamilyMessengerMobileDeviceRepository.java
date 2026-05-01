package project.tracknest.usertracking.domain.familymessenger.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.List;
import java.util.UUID;

interface FamilyMessengerMobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {

    @Query("SELECT d FROM MobileDevice d WHERE d.userId IN :userIds")
    List<MobileDevice> findAllByUserIdIn(@Param("userIds") List<UUID> userIds);
}
