package project.tracknest.usertracking.domain.notifier;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.RiskNotification;

import java.util.List;
import java.util.UUID;

interface NotifierRiskNotificationRepository extends JpaRepository<RiskNotification, UUID> {
    List<RiskNotification> findByUserId(UUID userId);
    void deleteByIdAndUserId(UUID id, UUID userId);
    void deleteByIdInAndUserId(List<UUID> ids, UUID userId);
    void deleteByUserId(UUID userId);
}
