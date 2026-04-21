package project.tracknest.usertracking.domain.familymessenger.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface FamilyMessengerFamilyCircleMemberRepository extends JpaRepository<FamilyCircleMember, UUID> {
    Optional<FamilyCircleMember> findById_FamilyCircleIdAndId_MemberId(UUID circleId, UUID memberId);
    List<FamilyCircleMember> findAllById_FamilyCircleId(UUID circleId);
}
