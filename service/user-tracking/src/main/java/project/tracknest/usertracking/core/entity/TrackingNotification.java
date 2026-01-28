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
@Table(name = "tracking_notification")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingNotification {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false, updatable = false)
    private User target;

    @NotBlank
    @Size(min = 8, max = 255)
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @NotBlank
    @Size(min = 8)
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @NotBlank
    @Size(min = 2, max = 50)
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "created_at", updatable = false, insertable = false)
    private OffsetDateTime createdAt;
}
