package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Data
@Entity
@Table(name = "tracking_notification_alerts_user")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackerTrackingNotification {
    @EmbeddedId
    private TrackerTrackingNotificationId id;

    @Column(name = "seen", nullable = false)
    private boolean seen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id", insertable = false, updatable = false)
    private TrackingNotification notification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracker_id", insertable = false, updatable = false)
    private User tracker;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class TrackerTrackingNotificationId {
        @Column(name = "tracker_id", nullable = false, updatable = false)
        private UUID trackerId;

        @Column(name = "notification_id", nullable = false, updatable = false)
        private UUID notificationId;
    }
}
