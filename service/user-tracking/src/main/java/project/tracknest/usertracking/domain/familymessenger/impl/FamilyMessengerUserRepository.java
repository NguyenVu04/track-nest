package project.tracknest.usertracking.domain.familymessenger.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.User;

import java.util.UUID;

interface FamilyMessengerUserRepository extends JpaRepository<User, UUID> {
}
