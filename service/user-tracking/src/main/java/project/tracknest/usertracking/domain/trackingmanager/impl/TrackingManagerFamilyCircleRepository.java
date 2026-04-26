package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.FamilyCircle;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

interface TrackingManagerFamilyCircleRepository extends JpaRepository<FamilyCircle, UUID> {
    @Query("""
    SELECT DISTINCT fc
    FROM FamilyCircleMember fcm
    JOIN fcm.familyCircle fc
    WHERE fcm.id.memberId = :userId
    ORDER BY fc.createdAt DESC, fc.id DESC
    """)
    Slice<FamilyCircle> findFirstPageByUserId(
            @Param("userId") UUID userId,
            Pageable pageable
    );


    @Query("""
    SELECT DISTINCT fc
    FROM FamilyCircleMember fcm
    JOIN fcm.familyCircle fc
    WHERE fcm.id.memberId = :userId
        AND (
           fc.createdAt < :lastCreatedAt
           OR (fc.createdAt = :lastCreatedAt AND fc.id < :lastId)
        )
    ORDER BY fc.createdAt DESC, fc.id DESC
    """)
    Slice<FamilyCircle> findNextPageByUserId(
            @Param("userId") UUID userId,
            @Param("lastCreatedAt") OffsetDateTime lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable
    );

    @Query("""
        SELECT fc
        FROM FamilyCircle fc
        WHERE fc.id = :circleId
            AND EXISTS (
                SELECT 1
                FROM FamilyCircleMember fcm
                WHERE fcm.familyCircle = fc
                    AND fcm.id.memberId = :adminId
                    AND fcm.isAdmin = true
            )
    """)
    Optional<FamilyCircle> findCircleIfAdmin(
            @Param("adminId") UUID adminId,
            @Param("circleId") UUID circleId
    );

}
