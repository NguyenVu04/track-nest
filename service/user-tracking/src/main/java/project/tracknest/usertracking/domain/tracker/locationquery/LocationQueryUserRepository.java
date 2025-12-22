package project.tracknest.usertracking.domain.tracker.locationquery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.tracknest.usertracking.core.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface LocationQueryUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findById(UUID id);
    @Query(
            value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END " +
                    "FROM tracker_tracks_target " +
                    "WHERE tracker_id = :trackerId AND target_id = :targetId",
            nativeQuery = true
    )
    boolean existsTrackingConnection(UUID trackerId, UUID targetId);
}
