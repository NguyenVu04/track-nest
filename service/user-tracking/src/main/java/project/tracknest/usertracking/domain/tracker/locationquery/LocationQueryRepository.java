package project.tracknest.usertracking.domain.tracker.locationquery;

import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.Location;

import java.util.List;
import java.util.Set;
import java.util.UUID;

interface LocationQueryRepository extends JpaRepository<Location, Location.LocationId> {
    @Query(value =
            "SELECT * FROM location l " +
                    "WHERE l.user_id IN (:userIds) " +
                    "AND ST_DWithin(l.geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius) " +
                    "ORDER BY l.timestamp DESC",
            nativeQuery = true
    )
    @QueryHints(
            value = {
                    @QueryHint(name = "org.hibernate.fetchSize", value = "256"),
                    @QueryHint(name = "org.hibernate.readOnly", value = "true")
            }
    )
    List<Location> findByUserIdInAndWithinRadius(
            @Param("userIds") Set<UUID> userIds,
            @Param("longitude") float longitude,
            @Param("latitude") float latitude,
            @Param("radius") double radius);
}
