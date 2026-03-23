package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.User;

import java.util.List;
import java.util.UUID;

interface LocationQueryUserRepository extends JpaRepository<User, UUID> {

    @Query("""
    SELECT u
    FROM User u
    WHERE u.id <> :userId
        AND EXISTS (
            SELECT 1
            FROM FamilyCircleMember fcm1
            JOIN FamilyCircleMember fcm2
                ON fcm1.id.familyCircleId = fcm2.id.familyCircleId
            WHERE fcm1.id.memberId = u.id
                AND fcm2.id.memberId = :userId
        )
    """)
    List<User> findAllUserFamilyMembers(@Param("userId") UUID userId);

    @Query("""
    SELECT fcm.member
    FROM FamilyCircleMember fcm
    WHERE fcm.id.familyCircleId = :circleId
        AND fcm.id.memberId != :userId
    """)
    List<User> findAllUserFamilyMembersInCircle(
            @Param("userId") UUID userId,
            @Param("circleId") UUID circleId
    );

    @Query("""
    SELECT EXISTS (
        SELECT 1
        FROM FamilyCircleMember fcm
        WHERE fcm.id.memberId = :userId
            AND fcm.id.familyCircleId = :circleId
        )
    """)
    boolean isCircleMember(
            @Param("userId") UUID userId,
            @Param("circleId") UUID circleId
    );

    @Query("""
    SELECT EXISTS (
        SELECT 1
        FROM FamilyCircleMember fcm
        WHERE fcm.id.memberId = :userId
            AND fcm.id.familyCircleId IN (
                SELECT fcm2.id.familyCircleId
                FROM FamilyCircleMember fcm2
                WHERE fcm2.id.memberId = :memberId
            )
        )
    """)
    boolean isFamilyMember(
            @Param("userId") UUID userId,
            @Param("memberId") UUID memberId
    );
}