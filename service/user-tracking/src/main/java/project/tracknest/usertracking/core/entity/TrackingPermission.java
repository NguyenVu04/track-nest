package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "tracking_permission")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingPermission {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expired_at", nullable = false, updatable = false)
    private OffsetDateTime expiredAt;

    @Column(name = "otp", nullable = false, updatable = false, length = 15)
    private String otp;

    @Column(name = "number_of_attempts", nullable = false)
    private int numberOfAttempts;
}
