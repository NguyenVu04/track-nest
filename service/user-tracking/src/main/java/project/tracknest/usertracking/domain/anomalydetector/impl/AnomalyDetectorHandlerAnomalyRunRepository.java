package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.AnomalyRun;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AnomalyDetectorHandlerAnomalyRunRepository extends JpaRepository<AnomalyRun, UUID> {
    Optional<AnomalyRun> findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(UUID userId);

    Optional<AnomalyRun> findFirstByUserIdOrderByLastSeenAtDesc(UUID userId);

    @Modifying
    @Query("DELETE FROM AnomalyRun ar WHERE ar.resolved = true AND ar.lastSeenAt < :threshold")
    int deleteResolvedBefore(@Param("threshold") OffsetDateTime threshold);
}
