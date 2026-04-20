package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.User;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface TrackerUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findById(UUID id);

    @Query(
      value = "SELECT u.id as id, u.username as username FROM \"user\" u WHERE u.last_active < :timestamp AND u.connected = true ORDER BY u.last_active ASC",
      countQuery = "SELECT count(*) FROM \"user\" u WHERE u.last_active < :timestamp AND u.connected = true",
      nativeQuery = true
    )
    Page<UserDisconnectView> findInactiveUsersSince(@Param("timestamp") OffsetDateTime timestamp, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE \"user\" SET connected = false WHERE id IN (:ids)", nativeQuery = true)
    void disconnectUsersById(@Param("ids") List<UUID> ids);
}