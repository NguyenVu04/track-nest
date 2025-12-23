package project.tracknest.usertracking.domain.notifier;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.TrackerTrackingNotification;

import java.util.List;
import java.util.UUID;

public interface NotifierTrackerTrackingNotificationRepository extends JpaRepository<TrackerTrackingNotification, TrackerTrackingNotification.TrackerTrackingNotificationId> {
    List<TrackerTrackingNotification> findById_TrackerId(UUID idTrackerId);
    void deleteById_TrackerIdAndId_NotificationId(UUID idTrackerId, UUID idNotificationId);
    void deleteById_TrackerIdAndId_NotificationIdIn(UUID idTrackerId, List<UUID> idNotificationIds);
    void deleteById_TrackerId(UUID idTrackerId);
}
