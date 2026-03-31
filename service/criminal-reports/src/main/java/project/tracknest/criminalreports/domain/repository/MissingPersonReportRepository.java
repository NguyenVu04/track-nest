package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MissingPersonReportRepository extends JpaRepository<MissingPersonReport, UUID> {
    
    @Query("SELECT m FROM MissingPersonReport m WHERE m.reporter.id = :reporterId")
    Page<MissingPersonReport> findByReporterId(@Param("reporterId") UUID reporterId, Pageable pageable);
    
    @Query("SELECT m FROM MissingPersonReport m WHERE m.reporter.id = :reporterId AND m.id = :id")
    Optional<MissingPersonReport> findByReporterIdAndId(@Param("reporterId") UUID reporterId, @Param("id") UUID id);
    
    @Query("SELECT m FROM MissingPersonReport m")
    Page<MissingPersonReport> findAllPublic(Pageable pageable);
    
    @Query("SELECT m FROM MissingPersonReport m WHERE m.status.name = :status")
    Page<MissingPersonReport> findAllPublicByStatus(@Param("status") String status, Pageable pageable);
}
