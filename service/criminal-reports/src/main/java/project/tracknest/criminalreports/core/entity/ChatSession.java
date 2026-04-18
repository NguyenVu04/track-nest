package project.tracknest.criminalreports.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "chat_session")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "started_at", insertable = false, updatable = false)
    private OffsetDateTime startedAt;

    @Column(name = "document_id", nullable = false, updatable = false)
    private UUID documentId;

    @Column(name = "message_left", nullable = false)
    private short messageLeft;

    @OneToMany(
            mappedBy = "chatSession",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ChatMessage> messages;
}
