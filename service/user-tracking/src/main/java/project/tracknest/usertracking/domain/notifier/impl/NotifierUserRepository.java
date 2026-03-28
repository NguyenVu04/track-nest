package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.User;

import java.util.List;
import java.util.UUID;

interface NotifierUserRepository extends JpaRepository<User, UUID> {
    @Query("""
    SELECT u
    FROM User u
    WHERE EXISTS (
            SELECT 1
            FROM FamilyCircleMember fcm1
            JOIN FamilyCircleMember fcm2
                ON fcm1.id.familyCircleId = fcm2.id.familyCircleId
            WHERE fcm1.id.memberId = u.id
                AND fcm2.id.memberId = :userId
        )
    """)
    List<User> findAllUserFamilyMembers(@Param("userId") UUID userId);
}
