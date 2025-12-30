package project.tracknest.criminalreports.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;
import org.hibernate.validator.constraints.Range;
import org.hibernate.validator.constraints.URL;
import org.locationtech.jts.geom.Point;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "crime_report")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrimeReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "title", nullable = false)
    private String title;

    @URL(message = "Invalid URL format")
    @Column(name = "content", nullable = false)
    private String content;

    @Range(min = 1, max = 5, message = "Severity must be between 1 and 5")
    @Column(name = "severity", nullable = false)
    private int severity;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    @Column(name = "longitude", nullable = false, updatable = false)
    private double longitude;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    @Column(name = "latitude", nullable = false, updatable = false)
    private double latitude;

    @Generated
    @Column(name = "geom", columnDefinition = "GEOMETRY(POINT, 4326)", updatable = false)
    private Point geom;

    @Min(value = 0, message = "Number of victims must be non-negative")
    @Column(name = "number_of_victims", nullable = false)
    private int numberOfVictims;

    @Min(value = 0, message = "Number of offenders must be non-negative")
    @Column(name = "number_of_offenders", nullable = false)
    private int numberOfOffenders;

    @Column(name = "arrested", nullable = false)
    private boolean arrested;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "public", nullable = false)
    private boolean isPublic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false, updatable = false)
    private Reporter reporter;
}