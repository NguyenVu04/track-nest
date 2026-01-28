package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@Entity
@Table(name = "user_in_family_circle")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyCircleMember {
    @EmbeddedId
    private FamilyCircleMemberId id;

    @Column(name = "admin", nullable = false)
    private boolean isAdmin;

    @Size(min = 1, max = 50)
    @Column(name = "role", length = 50)
    private String role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_circle_id", insertable = false, updatable = false)
    private FamilyCircle familyCircle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User member;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class FamilyCircleMemberId {

        @Column(name = "family_circle_id", nullable = false, updatable = false)
        private UUID familyCircleId;

        @Column(name = "user_id", nullable = false, updatable = false)
        private UUID memberId;

    }

}
