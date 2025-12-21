package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import lombok.*;
import org.locationtech.jts.geom.Point;

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
    private double latitude;

    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Column(name = "accuracy", nullable = false, updatable = false)
    private float accuracy;

    @Column(name = "velocity", nullable = false, updatable = false)
    private float velocity;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class LocationId {
        @Column(name = "user_id", nullable = false, updatable = false)
        private UUID userId;

        @Column(name = "timestamp", nullable = false, updatable = false)
        private OffsetDateTime timestamp;
    }
}
