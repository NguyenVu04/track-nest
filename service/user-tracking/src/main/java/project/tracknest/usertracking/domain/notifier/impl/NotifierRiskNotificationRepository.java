package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.RiskNotification;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface NotifierRiskNotificationRepository extends JpaRepository<RiskNotification, UUID> {
    @Query("""
        SELECT rn
        FROM RiskNotification rn
        WHERE rn.user.id = :userId
        ORDER BY rn.createdAt DESC, rn.id DESC
    """)
    Slice<RiskNotification> findFirstPageByUserId(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("""
        SELECT rn
        FROM RiskNotification rn
        WHERE rn.user.id = :userId
          AND (
                rn.createdAt < :lastCreatedAt
                OR (rn.createdAt = :lastCreatedAt AND rn.id < :lastId)
          )
        ORDER BY rn.createdAt DESC, rn.id DESC
    """)
    Slice<RiskNotification> findNextPageByUserId(
            @Param("userId") UUID userId,
            @Param("lastCreatedAt") OffsetDateTime lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable
    );


    Optional<RiskNotification> findByIdAndUserId(UUID id, UUID userId);

    void deleteByUserId(UUID userId);

    @Query("""
    SELECT rn FROM RiskNotification rn
    WHERE rn.id IN :notificationIds
        AND rn.user.id = :userId
    """)
    List<RiskNotification> findUserRiskNotifications(
            @Param("notificationIds") List<UUID> notificationIds,
            @Param("userId") UUID userId
    );

    int countByUser_Id(UUID userId);

    Optional<RiskNotification> findTopByUser_IdOrderByCreatedAt(UUID userId);
}
