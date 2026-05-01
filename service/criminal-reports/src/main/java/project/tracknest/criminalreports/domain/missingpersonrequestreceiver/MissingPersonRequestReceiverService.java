package project.tracknest.criminalreports.domain.missingpersonrequestreceiver;

import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface MissingPersonRequestReceiverService {
    MissingPersonReportResponse submitMissingPersonReport(
            UUID userId,
//            UUID reporterId,
            String title,
            String fullName,
            String personalId,
            String content,
            String photo,
            String contactEmail,
            String contactPhone,
            LocalDate date,
            double latitude,
            double longitude);
}
