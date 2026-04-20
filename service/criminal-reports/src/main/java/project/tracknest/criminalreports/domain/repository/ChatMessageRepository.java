package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.criminalreports.core.entity.ChatMessage;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
