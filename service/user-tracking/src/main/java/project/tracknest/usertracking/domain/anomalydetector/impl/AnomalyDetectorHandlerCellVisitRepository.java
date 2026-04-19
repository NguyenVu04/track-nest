package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.CellVisit;

import java.util.Optional;
import java.util.UUID;

public interface AnomalyDetectorHandlerCellVisitRepository extends JpaRepository<CellVisit, UUID> {
    Optional<CellVisit> findByUserIdAndCellIdAndBucketIdAndIsMature(
            UUID userId, String cellId, UUID bucketId
    );
}
