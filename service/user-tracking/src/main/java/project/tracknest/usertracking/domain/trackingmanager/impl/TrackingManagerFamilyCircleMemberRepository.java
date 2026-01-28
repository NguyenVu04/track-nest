package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;

import java.util.Optional;
import java.util.UUID;

interface TrackingManagerFamilyCircleMemberRepository extends JpaRepository<FamilyCircleMember, FamilyCircleMember.FamilyCircleMemberId> {
    Optional<FamilyCircleMember> findById_FamilyCircleIdAndId_MemberId(UUID circleId, UUID memberId);
}
