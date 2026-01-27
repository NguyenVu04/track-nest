package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.ParticipationPermission;

import java.util.UUID;

interface ParticipationPermissionRepository extends JpaRepository<ParticipationPermission, UUID> {
}
