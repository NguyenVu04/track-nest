package project.tracknest.criminalreports.domain.crimereportrequestreceiver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.Reporter;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.ReporterRepository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class CrimeReportRequestReceiverServiceImpl implements CrimeReportRequestReceiverService {

    private final CrimeReportRepository crimeReportRepository;
    private final ReporterRepository reporterRepository;

    @Override
    @Transactional
    public CrimeReportResponse submitCrimeReport(
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
            List<String> photos) {

        log.info("Submitting crime report for user: {}", userId);

        Reporter reporter = reporterRepository.findFirstByOrderByLastAssignedAtAsc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No available reporter found to assign the report. Please try again later."));

        reporter.setLastAssignedAt(OffsetDateTime.now());
        reporterRepository.save(reporter);

        CrimeReport report = CrimeReport.builder()
                .title(title)
                .content(content != null ? content : "")
                .severity(severity)
                .date(date)
                .longitude(longitude)
                .latitude(latitude)
                .numberOfVictims(numberOfVictims)
                .numberOfOffenders(numberOfOffenders)
                .arrested(arrested)
                .photos(photos)
                .reporter(reporter)
                .isPublic(false)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        CrimeReport saved = crimeReportRepository.save(report);
        log.info("Crime report submitted successfully: {}", saved.getId());
        return mapToResponse(saved);
    }

    private CrimeReportResponse mapToResponse(CrimeReport report) {
        return CrimeReportResponse.builder()
                .id(report.getId())
                .title(report.getTitle())
                .content(report.getContent())
                .severity(report.getSeverity())
                .date(report.getDate())
                .longitude(report.getLongitude())
                .latitude(report.getLatitude())
                .numberOfVictims(report.getNumberOfVictims())
                .numberOfOffenders(report.getNumberOfOffenders())
                .arrested(report.isArrested())
                .photos(report.getPhotos())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .publicFlag(false)
                .build();
    }
}
