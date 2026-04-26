package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.Location;

import java.time.OffsetDateTime;

interface TrackerLocationRepository extends JpaRepository<Location, Location.LocationId> {

    @Modifying
    @Query("DELETE FROM Location l WHERE l.id.timestamp < :threshold")
    int deleteByTimestampBefore(@Param("threshold") OffsetDateTime threshold);
}
