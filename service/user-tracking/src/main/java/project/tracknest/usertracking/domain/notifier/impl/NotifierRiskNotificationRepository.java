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

    // Returns risk notifications for userId AND all members that share a family circle with userId.
    @Query("""
        SELECT rn
        FROM RiskNotification rn
        WHERE rn.user.id = :userId
           OR rn.user.id IN (
               SELECT DISTINCT fcm2.id.memberId
               FROM FamilyCircleMember fcm1, FamilyCircleMember fcm2
               WHERE fcm1.id.memberId = :userId
                 AND fcm2.id.familyCircleId = fcm1.id.familyCircleId
                 AND fcm2.id.memberId <> :userId
           )
        ORDER BY rn.createdAt DESC, rn.id DESC
    """)
    Slice<RiskNotification> findFirstPageByUserId(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("""
        SELECT rn
        FROM RiskNotification rn
        WHERE (
            rn.user.id = :userId
            OR rn.user.id IN (
                SELECT DISTINCT fcm2.id.memberId
                FROM FamilyCircleMember fcm1, FamilyCircleMember fcm2
                WHERE fcm1.id.memberId = :userId
                  AND fcm2.id.familyCircleId = fcm1.id.familyCircleId
                  AND fcm2.id.memberId <> :userId
            )
        )
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

    @Query("""
        SELECT COUNT(DISTINCT rn.id)
        FROM RiskNotification rn
        WHERE rn.user.id = :userId
           OR rn.user.id IN (
               SELECT DISTINCT fcm2.id.memberId
               FROM FamilyCircleMember fcm1, FamilyCircleMember fcm2
               WHERE fcm1.id.memberId = :userId
                 AND fcm2.id.familyCircleId = fcm1.id.familyCircleId
                 AND fcm2.id.memberId <> :userId
           )
    """)
    long countForUserAndFamilyCircle(@Param("userId") UUID userId);

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
}
