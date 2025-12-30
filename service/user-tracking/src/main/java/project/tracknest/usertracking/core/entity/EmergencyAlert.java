package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
import org.hibernate.validator.constraints.Range;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "emergency_alert")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlert {
    @EmbeddedId
    private EmergencyAlertId id;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude", nullable = false, updatable = false)
    private float latitude;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude", nullable = false, updatable = false)
    private float longitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyAlertId {
        @Column(name = "user_id", nullable = false, updatable = false)
        private UUID userId;

        @Column(name = "created_at", nullable = false, updatable = false)
        private OffsetDateTime createdAt;
    }
}
