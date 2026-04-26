package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    @NotBlank
    @Size(min = 1)
    @Column(name = "device_token", nullable = false, updatable = false, columnDefinition = "TEXT")
    private String deviceToken;

    @NotBlank
    @Size(min = 2, max = 2)
    @Column(name = "language_code", nullable = false, length = 2)
    private String languageCode;

    @NotBlank
    @Size(min = 2, max = 50)
    @Column(name = "platform", nullable = false, length = 50)
    private String platform;

    @Column(name = "created_at", updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;
}
