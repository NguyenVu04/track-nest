package project.tracknest.usertracking.domain.trackingmanager.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.User;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

interface UserRepository extends JpaRepository<User, UUID> {
}