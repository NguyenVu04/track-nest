package project.tracknest.criminalreports.domain.crimereportrequestreceiver;

import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CrimeReportRequestReceiverService {
    CrimeReportResponse submitCrimeReport(
            UUID userId,
            String title,
            String content,
            int severity,
            LocalDate date,
            double longitude,
            double latitude,
            int numberOfVictims,
            int numberOfOffenders,
            boolean arrested,
            List<String> photos);
}
