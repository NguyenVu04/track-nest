package project.tracknest.emergencyops.domain.notificationoutbox.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.tracknest.emergencyops.core.entity.PendingNotification;

import java.util.List;
import java.util.UUID;

@Repository
interface PendingNotificationRepository extends JpaRepository<PendingNotification, UUID> {

    List<PendingNotification> findByUserIdAndDestinationAndDeliveredAtIsNullOrderByCreatedAtAsc(
            UUID userId, String destination);
}
