package project.tracknest.criminalreports.domain.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import project.tracknest.criminalreports.core.entity.CrimeReport;

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
    
    @Query(value = "SELECT * FROM crime_report c WHERE c.public = true AND ST_DWithin(c.geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radius) ORDER BY c.created_at DESC", 
           countQuery = "SELECT count(*) FROM crime_report c WHERE c.public = true AND ST_DWithin(c.geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radius)",
           nativeQuery = true)
    Page<CrimeReport> findAllPublicWithinRadius(
            @Param("longitude") double longitude, 
            @Param("latitude") double latitude, 
            @Param("radius") double radius,
            Pageable pageable);
}
