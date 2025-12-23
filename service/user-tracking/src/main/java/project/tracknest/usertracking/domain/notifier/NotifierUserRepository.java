package project.tracknest.usertracking.domain.notifier;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.UUID;

interface NotifierUserRepository extends JpaRepository<User, UUID> {
}
