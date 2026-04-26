package project.tracknest.criminalreports.domain.missingpersonrequestreceiver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.core.entity.MissingPersonReportStatus;
import project.tracknest.criminalreports.core.entity.Reporter;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportStatusRepository;
import project.tracknest.criminalreports.core.datatype.ReportStatusConstants;
import project.tracknest.criminalreports.domain.repository.ReporterRepository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class MissingPersonRequestReceiverServiceImpl implements MissingPersonRequestReceiverService {

    private final MissingPersonReportRepository missingPersonReportRepository;
    private final MissingPersonReportStatusRepository statusRepository;
    private final ReporterRepository reporterRepository;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @Value("${app.minio.public-url:http://localhost:38080/criminal-reports/file}")
    private String publicUrl;

    private static final String DEFAULT_STATUS = ReportStatusConstants.PENDING;

    @Override
    @Transactional
    public MissingPersonReportResponse submitMissingPersonReport(
            UUID userId,
            UUID reporterId,
            String title,
            String fullName,
            String personalId,
            String photo,
            String contactEmail,
            String contactPhone,
            LocalDate date
    ) {

        log.info("Submitting missing person report for user: {}", userId);

        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Reporter with ID " + reporterId + " not found"));

        MissingPersonReportStatus status = statusRepository.findByName(DEFAULT_STATUS)
                .orElseGet(() -> statusRepository.save(MissingPersonReportStatus.builder().name(DEFAULT_STATUS).build()));

        UUID reportId = UUID.randomUUID();
        String contentUrl = publicUrl + "/" + bucketName + "/" + reportId + "/index.html";

        MissingPersonReport report = MissingPersonReport.builder()
                .id(reportId)
                .title(title)
                .fullName(fullName)
                .personalId(personalId)
                .photo(photo != null ? photo : "")
                .date(date)
                .content(contentUrl)
                .contactEmail(contactEmail)
                .contactPhone(contactPhone)
                .userId(userId)
                .reporter(reporter)
                .status(status)
                .createdAt(OffsetDateTime.now())
                .build();

        MissingPersonReport saved = missingPersonReportRepository.save(report);
        log.info("Missing person report submitted successfully: {}", saved.getId());
        return mapToResponse(saved);
    }

    private MissingPersonReportResponse mapToResponse(MissingPersonReport report) {
        return MissingPersonReportResponse.builder()
                .id(report.getId())
                .title(report.getTitle())
                .fullName(report.getFullName())
                .personalId(report.getPersonalId())
                .photo(report.getPhoto())
                .date(report.getDate())
                .content(report.getContent())
                .contactEmail(report.getContactEmail())
                .contactPhone(report.getContactPhone())
                .createdAt(report.getCreatedAt())
                .userId(report.getUserId())
                .status(report.getStatus() != null ? report.getStatus().getName() : null)
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .publicFlag(false)
                .build();
    }
}
