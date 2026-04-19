package project.tracknest.usertracking.domain.anomalydetector.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.LocationBucket;

import java.util.Optional;
import java.util.UUID;

interface AnomalyDetectorLocationBucketRepository extends JpaRepository<LocationBucket, UUID> {
    Optional<LocationBucket> findByUserIdAndDayOfWeekAndHourOfDay(
            UUID userId, short dayOfWeek, short hourOfDay
    );
}
