package project.tracknest.usertracking.domain.notifier;

import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.QueryHints;
import project.tracknest.usertracking.core.entity.TrackerTrackingNotification;

import java.util.List;
import java.util.UUID;

public interface NotifierTrackerTrackingNotificationRepository extends JpaRepository<TrackerTrackingNotification, TrackerTrackingNotification.TrackerTrackingNotificationId> {
    @QueryHints(value = {
            @QueryHint(value = "org.hibernate.readOnly", name = "true"),
            @QueryHint(value = "org.hibernate.fetchSize", name = "64")
    })
    List<TrackerTrackingNotification> findById_TrackerId(UUID idTrackerId);
    void deleteById_TrackerIdAndId_NotificationId(UUID idTrackerId, UUID idNotificationId);
    void deleteById_TrackerIdAndId_NotificationIdIn(UUID idTrackerId, List<UUID> idNotificationIds);
    void deleteById_TrackerId(UUID idTrackerId);
}
