package project.tracknest.usertracking.domain.notifier.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.UUID;

interface UserRepository extends JpaRepository<User, UUID> {
}
