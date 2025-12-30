package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
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

    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @OneToMany(mappedBy = "emergencyServiceId", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmergencyServiceUser> emergencyServiceUsers;
}
