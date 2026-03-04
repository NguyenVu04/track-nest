package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "emergency_service_tracks_user")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyServiceUser {
    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "last_latitude", nullable = false)
    private double lastLatitude;

    @Column(name = "last_longitude", nullable = false)
    private double lastLongitude;

    @Column(name = "last_update_time", nullable = false)
    private OffsetDateTime lastUpdateTime;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_service_id", nullable = false, updatable = false)
    private EmergencyService emergencyService;
}
