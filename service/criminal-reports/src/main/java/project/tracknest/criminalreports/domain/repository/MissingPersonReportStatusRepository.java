package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.MissingPersonReportStatus;

import java.util.Optional;

@Repository
public interface MissingPersonReportStatusRepository extends JpaRepository<MissingPersonReportStatus, String> {
    Optional<MissingPersonReportStatus> findByName(String name);
}
