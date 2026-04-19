package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.AnomalyRun;

import java.util.Optional;
import java.util.UUID;

public interface AnomalyDetectorHandlerAnomalyRunRepository extends JpaRepository<AnomalyRun, UUID> {
    Optional<AnomalyRun> findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(UUID userId);
}
