package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.TrackerTrackingNotification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface NotifierTrackerTrackingNotificationRepository extends JpaRepository<TrackerTrackingNotification, TrackerTrackingNotification.TrackerTrackingNotificationId> {
    Optional<TrackerTrackingNotification> findById_TrackerIdAndId_NotificationId(UUID trackerId, UUID notificationId);

    void deleteById_TrackerId(UUID trackerId);

    @Query("""
    SELECT n FROM TrackerTrackingNotification n
    WHERE n.id.notificationId IN :notificationIds
        AND n.id.trackerId = :userId
    """)
    List<TrackerTrackingNotification> findUserNotificationIds(
            @Param("notificationIds") List<UUID> notificationIds,
            @Param("userId") UUID userId
    );

    int countById_TrackerId(UUID trackerId);
}
