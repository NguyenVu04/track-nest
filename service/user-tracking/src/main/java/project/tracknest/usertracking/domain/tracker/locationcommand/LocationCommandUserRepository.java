package project.tracknest.usertracking.domain.tracker.locationcommand;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface LocationCommandUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findById(UUID id);
}