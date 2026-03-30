package project.tracknest.criminalreports.domain.reportmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrimeReportResponse {
    private UUID id;
    private String title;
    private String content;
    private int severity;
    private LocalDate date;
    private double longitude;
    private double latitude;
    private int numberOfVictims;
    private int numberOfOffenders;
    private boolean arrested;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private UUID reporterId;
    private boolean isPublic;
}
