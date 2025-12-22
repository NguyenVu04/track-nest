package project.tracknest.usertracking.domain.trackingmanager;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.UUID;

interface TrackingManagerUserRepository extends JpaRepository<User, UUID> {
}
