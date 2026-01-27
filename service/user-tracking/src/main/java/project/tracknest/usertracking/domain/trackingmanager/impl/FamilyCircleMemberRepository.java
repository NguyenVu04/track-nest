package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;

import java.util.Optional;
import java.util.UUID;

interface FamilyCircleMemberRepository extends JpaRepository<FamilyCircleMember, FamilyCircleMember.FamilyCircleMemberId> {
    Optional<FamilyCircleMember> findById_FamilyCircleIdAndId_MemberId(UUID circleId, UUID memberId);
}
