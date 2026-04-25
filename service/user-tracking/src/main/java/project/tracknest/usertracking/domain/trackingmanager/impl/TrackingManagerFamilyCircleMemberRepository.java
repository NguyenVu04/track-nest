package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface TrackingManagerFamilyCircleMemberRepository extends JpaRepository<FamilyCircleMember, FamilyCircleMember.FamilyCircleMemberId> {
    Optional<FamilyCircleMember> findById_FamilyCircleIdAndId_MemberId(UUID circleId, UUID memberId);

    @Query("SELECT fcm FROM FamilyCircleMember fcm JOIN FETCH fcm.member WHERE fcm.id.familyCircleId = :circleId")
    List<FamilyCircleMember> findById_FamilyCircleId(@Param("circleId") UUID circleId);
}
