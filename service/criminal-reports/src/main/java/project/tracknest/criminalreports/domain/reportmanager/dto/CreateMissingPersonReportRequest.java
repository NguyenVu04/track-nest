package project.tracknest.criminalreports.domain.reportmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMissingPersonReportRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Personal ID is required")
    private String personalId;
    
    private String photo;

    private String content;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private Double latitude;

    private Double longitude;

    @Email(message = "Invalid email format")
    private String contactEmail;
    
    @NotBlank(message = "Contact phone is required")
    @Pattern(regexp = "^\\+?[0-9 .\\-()]{7,25}$", message = "Invalid phone number")
    private String contactPhone;
}
