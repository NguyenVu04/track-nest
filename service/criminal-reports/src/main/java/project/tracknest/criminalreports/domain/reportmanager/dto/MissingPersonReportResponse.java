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
public class MissingPersonReportResponse {
    private UUID id;
    private String title;
    private String fullName;
    private String personalId;
    private String photo;
    private LocalDate date;
    private String content;
    private String contactEmail;
    private String contactPhone;
    private OffsetDateTime createdAt;
    private UUID userId;
    private String status;
    private UUID reporterId;
    private boolean isPublic;
}
