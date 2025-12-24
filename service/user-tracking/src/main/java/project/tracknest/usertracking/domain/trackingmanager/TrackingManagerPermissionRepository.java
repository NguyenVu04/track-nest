package project.tracknest.usertracking.domain.trackingmanager;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import project.tracknest.usertracking.core.entity.TrackingPermission;

import java.util.UUID;

public interface TrackingManagerPermissionRepository extends JpaRepository<TrackingPermission, UUID> {
    @Modifying
    @Query(value = "DELETE FROM tracking_permission p WHERE p.expired_at < NOW()", nativeQuery = true)
    void deleteExpiredPermissions();
}
