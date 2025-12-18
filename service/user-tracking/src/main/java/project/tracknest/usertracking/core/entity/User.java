package project.tracknest.usertracking.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "user")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "connected", nullable = false)
    private boolean connected;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.MERGE})
    @JoinTable(
            name = "tracker_tracks_target",
            joinColumns = @JoinColumn(name = "tracker_id"),
            inverseJoinColumns = @JoinColumn(name = "target_id")
    )
    private Set<User> targets;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.MERGE})
    @JoinTable(
            name = "tracker_tracks_target",
            joinColumns = @JoinColumn(name = "target_id"),
            inverseJoinColumns = @JoinColumn(name = "tracker_id")
    )
    private Set<User> trackers;
}
