package project.tracknest.criminalreports.domain.reportmanager.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCrimeReportRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String content;

    @NotNull(message = "Severity is required")
    @Min(value = 1, message = "Severity must be at least 1")
    @Max(value = 5, message = "Severity must be at most 5")
    private int severity;
    
    @NotNull(message = "Date is required")
    private LocalDate date;
    
    @NotNull(message = "Longitude is required")
    private double longitude;
    
    @NotNull(message = "Latitude is required")
    private double latitude;
    
    @Min(value = 0, message = "Number of victims must be non-negative")
    private int numberOfVictims;
    
    @Min(value = 0, message = "Number of offenders must be non-negative")
    private int numberOfOffenders;
    
    private boolean arrested;

    private List<String> photos;
}
