package project.tracknest.criminalreports.domain.missingpersonrequestreceiver;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final EntityManager entityManager;
    private final MissingPersonReportRepository missingPersonReportRepository;
    private final MissingPersonReportStatusRepository statusRepository;
    private final ReporterRepository reporterRepository;

    private static final String DEFAULT_STATUS = ReportStatusConstants.PENDING;

    @Override
    @Transactional
    public MissingPersonReportResponse submitMissingPersonReport(
            UUID userId,
            // UUID reporterId,
            String title,
            String fullName,
            String personalId,
            String content,
            String photo,
            String contactEmail,
            String contactPhone,
            LocalDate date,
            double latitude,
            double longitude
    ) {

        log.info("Submitting missing person report for user: {}", userId);

        Reporter reporter = reporterRepository.findFirstByOrderByLastAssignedAtAsc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No available reporter found to assign the report. Please try again later."));

        reporter.setLastAssignedAt(OffsetDateTime.now());
        reporterRepository.save(reporter);

        MissingPersonReportStatus status = statusRepository.findByName(DEFAULT_STATUS)
                .orElseGet(() -> statusRepository.save(MissingPersonReportStatus.builder().name(DEFAULT_STATUS).build()));

        MissingPersonReport report = MissingPersonReport.builder()
                .title(title)
                .fullName(fullName)
                .personalId(personalId)
                .photo(photo != null ? photo : "")
                .date(date)
                .content(content != null ? content : "")
                .contactEmail(contactEmail)
                .contactPhone(contactPhone)
                .userId(userId)
                .reporter(reporter)
                .status(status)
                .createdAt(OffsetDateTime.now())
                .latitude(latitude)
                .longitude(longitude)
                .build();

        MissingPersonReport saved = missingPersonReportRepository.saveAndFlush(report);
        entityManager.refresh(saved);
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
