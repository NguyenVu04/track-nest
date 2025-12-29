package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "safe_zone")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafeZone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @Column(name = "name", nullable = false, updatable = false, unique = true, length = 100)
    private String name;

    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @Column(name = "radius", nullable = false, updatable = false)
    private double radius;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_service_id", nullable = false, updatable = false)
    private EmergencyService emergencyService;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
