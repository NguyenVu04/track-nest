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
@Table(name = "mobile_device")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobileDevice {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_token", nullable = false, updatable = false, columnDefinition = "TEXT")
    private String deviceToken;

    @Column(name = "language_code", nullable = false, length = 2)
    private String languageCode;

    @Column(name = "created_at", updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;
}
