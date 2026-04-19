package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import project.tracknest.usertracking.core.entity.LocationBucket;

import java.util.Optional;
import java.util.UUID;

interface AnomalyDetectorLocationBucketRepository extends JpaRepository<LocationBucket, UUID> {
    Optional<LocationBucket> findByUserIdAndDayOfWeekAndHourOfDay(
            UUID userId, short dayOfWeek, short hourOfDay
    );

    @Modifying
    @Query(
            value = """
                    UPDATE location_bucket lb
                    SET total_num_visits = COALESCE((
                        SELECT SUM(num_visits)::INTEGER FROM cell_visit WHERE bucket_id = lb.id
                    ), 0)
                    """,
            nativeQuery = true
    )
    int recalculateTotalNumVisits();
}
