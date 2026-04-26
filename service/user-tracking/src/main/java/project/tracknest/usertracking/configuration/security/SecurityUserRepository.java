package project.tracknest.usertracking.configuration.security;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.UUID;

public interface SecurityUserRepository extends JpaRepository<User, UUID> {
}
