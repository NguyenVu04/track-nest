package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.TrackingNotification;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface NotifierTrackingNotificationRepository extends JpaRepository<TrackingNotification, UUID> {
    @Query("""
        SELECT tn
        FROM TrackingNotification tn
        WHERE tn.id IN (
            SELECT ttn.id.notificationId
            FROM TrackerTrackingNotification ttn
            WHERE ttn.id.trackerId = :trackerId
        )
        ORDER BY tn.createdAt DESC, tn.id DESC
    """)
    Slice<TrackingNotification> findFirstPageByTrackerId(
            @Param("trackerId") UUID trackerId,
            Pageable pageable
    );

    @Query("""
        SELECT tn
        FROM TrackingNotification tn
        WHERE tn.id IN (
            SELECT ttn.id.notificationId
            FROM TrackerTrackingNotification ttn
            WHERE ttn.id.trackerId = :trackerId
        )
        AND (
            tn.createdAt < :lastCreatedAt
            OR (tn.createdAt = :lastCreatedAt AND tn.id < :lastId)
        )
        ORDER BY tn.createdAt DESC, tn.id DESC
    """)
    Slice<TrackingNotification> findNextPageByTrackerId(
            @Param("trackerId") UUID trackerId,
            @Param("lastCreatedAt") OffsetDateTime lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable
    );

    Optional<TrackingNotification> findTopByTarget_IdOrderByCreatedAt(UUID targetId);
}
