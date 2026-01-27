package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.TrackingNotification;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface TrackingNotificationRepository extends JpaRepository<TrackingNotification, UUID> {
    @Query("""
        SELECT tn FROM TrackingNotification tn
        WHERE tn.id IN (
            SELECT ttn.id.notificationId
            FROM TrackerTrackingNotification ttn
            WHERE ttn.id.trackerId = :trackerId
        )
        AND (
            :lastCreatedAt IS NULL
            OR (
                tn.createdAt < :lastCreatedAt
                OR (tn.createdAt = :lastCreatedAt AND tn.id < :lastId)
            )
        ) ORDER BY tn.createdAt DESC, tn.id DESC
    """)
    Slice<TrackingNotification> findByTrackerId(
            @Param("trackerId") UUID trackerId,
            @Param("lastCreatedAt") OffsetDateTime lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable
    );

}
