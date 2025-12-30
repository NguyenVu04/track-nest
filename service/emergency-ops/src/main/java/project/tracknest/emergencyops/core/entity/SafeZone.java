package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
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
@Table(name = "safe_zone")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafeZone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, updatable = false, unique = true, length = 100)
    private String name;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @Min(value = 0, message = "Radius must be non-negative")
    @Column(name = "radius", nullable = false, updatable = false)
    private double radius;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_service_id", nullable = false, updatable = false)
    private EmergencyService emergencyService;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
