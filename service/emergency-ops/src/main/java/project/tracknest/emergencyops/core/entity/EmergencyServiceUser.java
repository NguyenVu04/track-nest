package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_service_id", nullable = false, updatable = false)
    private EmergencyService emergencyServiceId;
}
