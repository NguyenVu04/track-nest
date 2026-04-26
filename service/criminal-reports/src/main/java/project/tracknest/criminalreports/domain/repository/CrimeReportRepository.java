package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.CrimeReport;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrimeReportRepository extends JpaRepository<CrimeReport, UUID> {
    
    @Query("SELECT c FROM CrimeReport c WHERE c.reporter.id = :reporterId")
    Page<CrimeReport> findByReporterId(@Param("reporterId") UUID reporterId, Pageable pageable);
    
    @Query("SELECT c FROM CrimeReport c WHERE c.reporter.id = :reporterId AND c.id = :id")
    Optional<CrimeReport> findByReporterIdAndId(@Param("reporterId") UUID reporterId, @Param("id") UUID id);
    
    @Query("SELECT c FROM CrimeReport c WHERE c.isPublic = true")
    Page<CrimeReport> findAllPublic(Pageable pageable);
    
    @Query("SELECT c FROM CrimeReport c WHERE c.isPublic = true AND c.severity >= :minSeverity")
    Page<CrimeReport> findAllPublicByMinSeverity(@Param("minSeverity") int minSeverity, Pageable pageable);

    @Query("SELECT c FROM CrimeReport c WHERE c.severity >= :minSeverity")
    Page<CrimeReport> findAllByMinSeverity(@Param("minSeverity") int minSeverity, Pageable pageable);

    @Query("SELECT c FROM CrimeReport c WHERE c.reporter.id = :reporterId AND c.severity >= :minSeverity")
    Page<CrimeReport> findByReporterIdAndMinSeverity(@Param("reporterId") UUID reporterId, @Param("minSeverity") int minSeverity, Pageable pageable);

    @Query("SELECT c FROM CrimeReport c WHERE c.reporter.id = :reporterId AND c.isPublic = :isPublic")
    Page<CrimeReport> findByReporterIdAndIsPublic(@Param("reporterId") UUID reporterId, @Param("isPublic") boolean isPublic, Pageable pageable);
    
    @Query("SELECT c FROM CrimeReport c WHERE c.date >= :startDate AND c.date <= :endDate")
    List<CrimeReport> findByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(c) FROM CrimeReport c WHERE c.arrested = true")
    long countResolved();

    @Query("SELECT COUNT(c) FROM CrimeReport c WHERE c.isPublic = true AND c.arrested = false")
    long countActive();

    @Query("SELECT COUNT(c) FROM CrimeReport c WHERE c.isPublic = false AND c.arrested = false")
    long countInvestigating();

    @Query("SELECT COUNT(c) FROM CrimeReport c WHERE c.date >= :startDate AND c.date <= :endDate")
    long countByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT c FROM CrimeReport c WHERE c.createdAt >= :startDate AND c.createdAt <= :endDate")
    List<CrimeReport> findByCreatedAtBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query(value = "SELECT * FROM crime_report c WHERE c.public = true AND ST_DWithin(c.geom::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius) ORDER BY c.created_at DESC",
           countQuery = "SELECT count(*) FROM crime_report c WHERE c.public = true AND ST_DWithin(c.geom::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius)",
           nativeQuery = true)
    Page<CrimeReport> findAllPublicWithinRadius(
            @Param("longitude") double longitude, 
            @Param("latitude") double latitude, 
            @Param("radius") double radius,
            Pageable pageable);
}
