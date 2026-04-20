package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(
        name = "cell_visit",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"cell_id", "bucket_id"})
        }
)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CellVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @NotBlank
    @Size(max = 16)
    @Column(name = "cell_id", nullable = false, length = 16)
    private String cellId;

    @Column(name = "bucket_id", nullable = false, updatable = false)
    private UUID bucketId;

    @Column(name = "first_seen", insertable = false, updatable = false)
    private OffsetDateTime firstSeen;

    @Column(name = "last_seen", nullable = false)
    private OffsetDateTime lastSeen;

    @Min(0)
    @Column(name = "num_visits", nullable = false)
    private int numVisits;

    @Column(name = "mature", nullable = false)
    private boolean mature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bucket_id", insertable = false, updatable = false)
    private LocationBucket bucket;
}
