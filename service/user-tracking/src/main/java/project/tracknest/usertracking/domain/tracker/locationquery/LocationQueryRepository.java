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
                    "WHERE l.user_id = :userId" +
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
    List<Location> findByUserIdAndWithinRadius(
            @Param("userId") UUID userId,
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radius") float radius);

    @Query(
            value = "SELECT DISTINCT ON (l.user_id) l.* " +
                    "FROM location l " +
                    "WHERE l.user_id IN (:userIds) " +
                    "ORDER BY l.user_id, l.timestamp DESC",
            nativeQuery = true
    )
    @QueryHints(value = {
            @QueryHint(name = "org.hibernate.fetchSize", value = "256"),
            @QueryHint(name = "org.hibernate.readOnly", value = "true")
    })
    List<Location> findLatestByUserIdIn(@Param("userIds") Set<UUID> userIds);
}
