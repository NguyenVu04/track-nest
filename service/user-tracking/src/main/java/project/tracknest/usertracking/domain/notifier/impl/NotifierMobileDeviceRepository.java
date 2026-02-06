package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.MobileDevice;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface NotifierMobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {
    Optional<MobileDevice> findByIdAndUserId(UUID id, UUID userId);

    List<MobileDevice> findAllByUserId(UUID userId);

    @Query("""
    SELECT DISTINCT d
    FROM MobileDevice d
    JOIN FamilyCircleMember fcm1
      ON d.userId = fcm1.id.memberId
    JOIN FamilyCircleMember fcm2
      ON fcm1.id.familyCircleId = fcm2.id.familyCircleId
    WHERE fcm2.id.memberId = :targetId
      AND fcm1.id.memberId <> :targetId
    """)
    List<MobileDevice> findByTargetId(@Param("targetId") UUID targetId);
}