package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "participation_permission")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationPermission {
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID familyCircleId;

    @Length(max = 16)
    @Column(
            name = "otp",
            updatable = false,
            nullable = false,
            unique = true,
            length = 16
    )
    private String otp;

    @Min(0)
    @Column(name = "number_of_attempts", nullable = false)
    private int numberOfAttempts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expired_at", nullable = false, updatable = false)
    private OffsetDateTime expiredAt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_circle_id", insertable = false, updatable = false)
    private FamilyCircle familyCircle;

}
