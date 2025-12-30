package project.tracknest.emergencyops.core.entity;

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
@Table(name = "emergency_request")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequest {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "open_at", nullable = false)
    private OffsetDateTime openAt;

    @Column(name = "close_at")
    private OffsetDateTime closeAt;

    @Column(name = "sender_id", nullable = false, updatable = false)
    private UUID senderId;

    @Column(name = "target_id", nullable = false, updatable = false)
    private UUID targetId;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_service_id", nullable = false, updatable = false)
    private EmergencyService emergencyServiceId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_name", nullable = false)
    private EmergencyRequestStatus status;
}
