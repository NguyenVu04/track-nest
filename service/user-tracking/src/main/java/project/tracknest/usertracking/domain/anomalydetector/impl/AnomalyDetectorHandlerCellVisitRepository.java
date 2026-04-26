package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.CellVisit;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AnomalyDetectorHandlerCellVisitRepository extends JpaRepository<CellVisit, UUID> {

    Optional<CellVisit> findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(
            UUID userId, UUID bucketId, String cellId
    );

    Optional<CellVisit> findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(
            UUID userId, UUID bucketId, Collection<String> cellIds
    );

    @Modifying
    @Query("DELETE FROM CellVisit cv WHERE cv.lastSeen < :threshold")
    int deleteByLastSeenBefore(@Param("threshold") OffsetDateTime threshold);

    @Modifying
    @Query("UPDATE CellVisit cv SET cv.mature = true WHERE cv.mature = false AND cv.numVisits > :minVisits")
    int markMatureWhereNumVisitsGreaterThan(@Param("minVisits") int minVisits);
}
