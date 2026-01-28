package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "\"user\"")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "connected", nullable = false)
    private boolean connected;

    @Column(name = "last_active", nullable = false)
    private OffsetDateTime lastActive;

    @NotBlank
    @Size(min = 1, max = 50)
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "avatar_url", nullable = true, columnDefinition = "TEXT")
    private String avatarUrl;

    @OneToMany(
            mappedBy = "member",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<FamilyCircleMember> familyCircles;
}
