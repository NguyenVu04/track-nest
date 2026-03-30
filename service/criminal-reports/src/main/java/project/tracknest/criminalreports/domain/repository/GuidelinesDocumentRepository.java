package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.GuidelinesDocument;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuidelinesDocumentRepository extends JpaRepository<GuidelinesDocument, UUID> {
    
    @Query("SELECT g FROM GuidelinesDocument g WHERE g.reporter.id = :reporterId")
    Page<GuidelinesDocument> findByReporterId(@Param("reporterId") UUID reporterId, Pageable pageable);
    
    @Query("SELECT g FROM GuidelinesDocument g WHERE g.reporter.id = :reporterId AND g.id = :id")
    Optional<GuidelinesDocument> findByReporterIdAndId(@Param("reporterId") UUID reporterId, @Param("id") UUID id);
    
    @Query("SELECT g FROM GuidelinesDocument g WHERE g.isPublic = true")
    Page<GuidelinesDocument> findAllPublic(Pageable pageable);
}
