package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
//import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "location")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {
    @EmbeddedId
    private LocationId id;

    @Column(name = "latitude", nullable = false, updatable = false)
    private float latitude;

    @Column(name = "longitude", nullable = false, updatable = false)
    private float longitude;

    @Column(name = "accuracy", nullable = false, updatable = false)
    private float accuracy;

    @Column(name = "velocity", nullable = false, updatable = false)
    private float velocity;

    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class LocationId {
        @Column(name = "user_id", nullable = false, updatable = false)
        private UUID userId;

        @Column(name = "timestamp", updatable = false)
        private OffsetDateTime timestamp;
    }
}
