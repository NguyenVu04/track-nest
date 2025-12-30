package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
import org.hibernate.validator.constraints.Range;
import org.locationtech.jts.geom.Point;

import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "emergency_service")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyService {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @OneToMany(mappedBy = "emergencyServiceId", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmergencyServiceUser> emergencyServiceUsers;
}
