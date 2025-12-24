package project.tracknest.usertracking.domain.notifier;

import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.QueryHints;
import project.tracknest.usertracking.core.entity.RiskNotification;

import java.util.List;
import java.util.UUID;

interface NotifierRiskNotificationRepository extends JpaRepository<RiskNotification, UUID> {
    @QueryHints(value = {
            @QueryHint(value = "org.hibernate.readOnly", name = "true"),
            @QueryHint(value = "org.hibernate.fetchSize", name = "64")
    })
    List<RiskNotification> findByUserId(UUID userId);
    void deleteByIdAndUserId(UUID id, UUID userId);
    void deleteByIdInAndUserId(List<UUID> ids, UUID userId);
    void deleteByUserId(UUID userId);
}
