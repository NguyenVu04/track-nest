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
@Table(name = "family_message")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", insertable = false, updatable = false)
    UUID id;

    @Column(name = "family_circle_id", nullable = false, updatable = false)
    UUID familyCircleId;

    @Column(name = "sender_id", nullable = false, updatable = false)
    UUID senderId;

    @Column(name = "content", nullable = false, length = 1000)
    String content;

    @Column(name = "created_at", insertable = false, updatable = false)
    OffsetDateTime createdAt;
}
