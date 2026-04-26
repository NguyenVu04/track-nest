package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Generated;
import org.hibernate.validator.constraints.Range;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "emergency_service")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class EmergencyService {
    @EqualsAndHashCode.Include
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @EqualsAndHashCode.Include
    @Range(min = 3, max = 255, message = "Username must be between 3 and 255 characters")
    @Column(name = "username", nullable = false, updatable = false)
    private String username;

    @EqualsAndHashCode.Include
    @Range(min = 3, max = 25, message = "Phone number must be between 3 and 25 characters")
    @Column(name = "phone_number", nullable = false, updatable = false)
    private String phoneNumber;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude")
    private Double longitude;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;
}
