package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.Reporter;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReporterRepository extends JpaRepository<Reporter, UUID> {
    Optional<Reporter> findById(UUID id);
}
