package project.tracknest.usertracking.domain.trackingmanager;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.TrackingPermission;

import java.util.UUID;

public interface TrackingManagerPermissionRepository extends JpaRepository<TrackingPermission, UUID> {
}
