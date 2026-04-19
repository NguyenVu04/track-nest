package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(
        name = "location_bucket",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "day_of_week", "hour_of_day"})
        }
)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationBucket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Min(0)
    @Max(6)
    @Column(name = "day_of_week", nullable = false)
    private short dayOfWeek;

    @Min(0)
    @Max(23)
    @Column(name = "hour_of_day", nullable = false)
    private short hourOfDay;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Min(0)
    @Column(name = "total_num_visits", nullable = false)
    private int totalNumVisits;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @OneToMany(
            fetch = FetchType.LAZY,
            mappedBy = "bucket",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<CellVisit> cellVisits;
}
