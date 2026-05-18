package project.tracknest.criminalreports.domain.reportmanager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.dto.ReportNotificationMessage;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.core.datatype.ReportStatusConstants;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.GuidelinesDocument;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.core.entity.MissingPersonReportStatus;
import project.tracknest.criminalreports.core.entity.Reporter;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.GuidelinesDocumentRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportStatusRepository;
import project.tracknest.criminalreports.domain.repository.ReporterRepository;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class ReportManagerServiceImpl implements ReportManagerService {

    private final MissingPersonReportRepository missingPersonReportRepository;
    private final CrimeReportRepository crimeReportRepository;
    private final GuidelinesDocumentRepository guidelinesDocumentRepository;
    private final ReporterRepository reporterRepository;
    private final MissingPersonReportStatusRepository statusRepository;
    private final ObjectStorage objectStorage;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    private static final String DEFAULT_STATUS = ReportStatusConstants.PENDING;
    private static final String TOPIC_MISSING_PERSON = "/topic/reports/missing-person";
    private static final String TOPIC_CRIME          = "/topic/reports/crime";
    private static final String TOPIC_GUIDELINE      = "/topic/reports/guideline";

    private void broadcast(String topic, String eventType, UUID reportId, String title, String reportType) {
        try {
            messagingTemplate.convertAndSend(topic, ReportNotificationMessage.builder()
                    .eventType(eventType)
                    .reportId(reportId)
                    .title(title)
                    .reportType(reportType)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to broadcast {} notification for {}: {}", eventType, reportId, e.getMessage());
        }
    }

    // ── Missing Person Reports ────────────────────────────────────────────────

    @Override
    @Transactional
    public MissingPersonReportResponse createMissingPersonReport(UUID reporterId, CreateMissingPersonReportRequest request) {
        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseGet(() -> reporterRepository.save(Reporter.builder().id(reporterId).build()));

        MissingPersonReportStatus status = statusRepository.findByName(DEFAULT_STATUS)
                .orElseGet(() -> statusRepository.save(MissingPersonReportStatus.builder().name(DEFAULT_STATUS).build()));

        MissingPersonReport report = MissingPersonReport.builder()
                .title(request.getTitle())
                .fullName(request.getFullName())
                .personalId(request.getPersonalId())
                .photo(request.getPhoto() != null ? request.getPhoto() : "")
                .date(request.getDate())
                .content(request.getContent() != null ? request.getContent() : "")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .userId(reporterId)
                .reporter(reporter)
                .status(status)
                .createdAt(OffsetDateTime.now())
                .build();

        MissingPersonReportResponse response = mapToMissingPersonReportResponse(missingPersonReportRepository.save(report));
        broadcast(TOPIC_MISSING_PERSON, "CREATED", response.getId(), response.getTitle(), "missing-person");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MissingPersonReportResponse getMissingPersonReport(UUID reporterId, UUID reportId) {
        return mapToMissingPersonReportResponse(findMissingPersonReportOwned(reporterId, reportId));
    }

    @Override
    @Transactional
    public MissingPersonReportResponse updateMissingPersonReport(UUID reporterId, UUID reportId, UpdateMissingPersonReportRequest request) {
        MissingPersonReport report = findMissingPersonReportOwned(reporterId, reportId);
        String currentStatus = report.getStatus() != null ? report.getStatus().getName() : null;
        if (ReportStatusConstants.PUBLISHED.equals(currentStatus) || ReportStatusConstants.REJECTED.equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot update a report that is already " + currentStatus);
        }
        report.setTitle(request.getTitle());
        report.setFullName(request.getFullName());
        report.setPersonalId(request.getPersonalId());
        if (request.getPhoto() != null) report.setPhoto(request.getPhoto());
        if (request.getContent() != null) {
            String oldContent = report.getContent();
            report.setContent(uploadHtmlContent(request.getContent()));
            if (oldContent != null && !oldContent.isBlank()) objectStorage.deleteFile(bucketName, oldContent);
        }
        report.setDate(request.getDate());
        if (request.getLatitude() != null) report.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) report.setLongitude(request.getLongitude());
        report.setContactEmail(request.getContactEmail());
        report.setContactPhone(request.getContactPhone());
        return mapToMissingPersonReportResponse(missingPersonReportRepository.save(report));
    }

    @Override
    @Transactional
    public void deleteMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = findMissingPersonReportOwned(reporterId, reportId);
        String photo = report.getPhoto();
        String title = report.getTitle();
        missingPersonReportRepository.delete(report);
        if (photo != null && !photo.isBlank()) objectStorage.deleteFile(bucketName, photo);
        broadcast(TOPIC_MISSING_PERSON, "DELETED", reportId, title, "missing-person");
    }

    @Override
    @Transactional
    public MissingPersonReportResponse publishMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = findMissingPersonReportOwned(reporterId, reportId);
        String currentStatus = report.getStatus() != null ? report.getStatus().getName() : null;
        if (ReportStatusConstants.PUBLISHED.equals(currentStatus) || ReportStatusConstants.REJECTED.equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot publish a report that is already " + currentStatus);
        }
        MissingPersonReportStatus publishedStatus = statusRepository.findByName(ReportStatusConstants.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PUBLISHED status not found"));
        report.setStatus(publishedStatus);
        MissingPersonReportResponse response = mapToMissingPersonReportResponse(missingPersonReportRepository.save(report));
        broadcast(TOPIC_MISSING_PERSON, "PUBLISHED", response.getId(), response.getTitle(), "missing-person");
        return response;
    }

    @Override
    @Transactional
    public MissingPersonReportResponse rejectMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = findMissingPersonReportOwned(reporterId, reportId);
        String currentStatus = report.getStatus() != null ? report.getStatus().getName() : null;
        if (ReportStatusConstants.PUBLISHED.equals(currentStatus) || ReportStatusConstants.REJECTED.equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot reject a report that is already " + currentStatus);
        }
        MissingPersonReportStatus rejectedStatus = statusRepository.findByName(ReportStatusConstants.REJECTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "REJECTED status not found"));
        report.setStatus(rejectedStatus);
        return mapToMissingPersonReportResponse(missingPersonReportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MissingPersonReportResponse> listMissingPersonReports(UUID reporterId, String status, String title, boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String titleParam = (title != null && !title.isBlank()) ? "%" + title.trim().toLowerCase() + "%" : null;
        String statusParam = (status != null && !status.isBlank()) ? status : (isPublic ? ReportStatusConstants.PUBLISHED : null);
        Page<MissingPersonReport> reports = missingPersonReportRepository.findByFilters(
                reporterId, statusParam, titleParam, pageRequest);
        return mapToPageResponse(reports.map(this::mapToMissingPersonReportResponse));
    }

    // ── Crime Reports ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CrimeReportResponse createCrimeReport(UUID reporterId, CreateCrimeReportRequest request) {
        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseGet(() -> reporterRepository.save(Reporter.builder().id(reporterId).build()));

        String contentObjectName = uploadHtmlContent(request.getContent());

        CrimeReport report = CrimeReport.builder()
                .title(request.getTitle())
            .content(contentObjectName)
                .severity(request.getSeverity())
                .date(request.getDate())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .numberOfVictims(request.getNumberOfVictims())
                .numberOfOffenders(request.getNumberOfOffenders())
                .arrested(request.isArrested())
                .photos(request.getPhotos() != null ? request.getPhotos() : new java.util.ArrayList<>())
                .reporter(reporter)
                .isPublic(false)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        CrimeReportResponse response = mapToCrimeReportResponse(crimeReportRepository.save(report));
        broadcast(TOPIC_CRIME, "CREATED", response.getId(), response.getTitle(), "crime");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CrimeReportResponse getCrimeReport(UUID reporterId, UUID reportId) {
        return mapToCrimeReportResponse(findCrimeReportOwned(reporterId, reportId));
    }

    @Override
    @Transactional
    public CrimeReportResponse updateCrimeReport(UUID reporterId, UUID reportId, UpdateCrimeReportRequest request) {
        CrimeReport report = findCrimeReportOwned(reporterId, reportId);
        if (report.isPublic()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot update a published crime report");
        }
        report.setTitle(request.getTitle());
        if (request.getContent() != null) {
            String oldContent = report.getContent();
            report.setContent(uploadHtmlContent(request.getContent()));
            if (oldContent != null && !oldContent.isBlank()) objectStorage.deleteFile(bucketName, oldContent);
        }
        report.setSeverity(request.getSeverity());
        report.setDate(request.getDate());
        report.setNumberOfVictims(request.getNumberOfVictims());
        report.setNumberOfOffenders(request.getNumberOfOffenders());
        report.setArrested(request.isArrested());
        if (request.getPhotos() != null) report.setPhotos(request.getPhotos());
        report.setUpdatedAt(OffsetDateTime.now());
        return mapToCrimeReportResponse(crimeReportRepository.save(report));
    }

    @Override
    @Transactional
    public CrimeReportResponse publishCrimeReport(UUID reporterId, UUID reportId) {
        CrimeReport report = findCrimeReportOwned(reporterId, reportId);
        if (report.isPublic()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Crime report is already published");
        }
        report.setPublic(true);
        CrimeReportResponse response = mapToCrimeReportResponse(crimeReportRepository.save(report));
        broadcast(TOPIC_CRIME, "PUBLISHED", response.getId(), response.getTitle(), "crime");
        return response;
    }

    @Override
    @Transactional
    public void deleteCrimeReport(UUID reporterId, UUID reportId) {
        CrimeReport report = findCrimeReportOwned(reporterId, reportId);
        String title = report.getTitle();
        crimeReportRepository.delete(report);
        broadcast(TOPIC_CRIME, "DELETED", reportId, title, "crime");
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> listCrimeReports(UUID reporterId, Integer minSeverity, Integer maxSeverity, String title, boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String titleParam = (title != null && !title.isBlank()) ? "%" + title.trim().toLowerCase() + "%" : null;
        Page<CrimeReport> reports = crimeReportRepository.findByFilters(
                reporterId, isPublic, minSeverity, maxSeverity, titleParam, pageRequest);
        return mapToPageResponse(reports.map(this::mapToCrimeReportResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> listCrimeReportsWithinRadius(double longitude, double latitude, double radius, int page, int size) {
        return mapToPageResponse(
                crimeReportRepository.findAllPublicWithinRadius(longitude, latitude, radius, PageRequest.of(page, size))
                        .map(this::mapToCrimeReportResponse));
    }

    // ── Guidelines Documents ─────────────────────────────────────────────────

    @Override
    @Transactional
    public GuidelinesDocumentResponse createGuidelinesDocument(UUID reporterId, CreateGuidelinesDocumentRequest request) {
        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseGet(() -> reporterRepository.save(Reporter.builder().id(reporterId).build()));

        String contentObjectName = uploadHtmlContent(request.getContent());

        GuidelinesDocument document = GuidelinesDocument.builder()
                .title(request.getTitle())
                .abstractText(request.getAbstractText())
            .content(contentObjectName)
                .isPublic(request.isPublic())
                .reporter(reporter)
                .createdAt(OffsetDateTime.now())
                .build();

        GuidelinesDocumentResponse response = mapToGuidelinesDocumentResponse(guidelinesDocumentRepository.save(document));
        broadcast(TOPIC_GUIDELINE, "CREATED", response.getId(), response.getTitle(), "guideline");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public GuidelinesDocumentResponse getGuidelinesDocument(UUID reporterId, UUID documentId) {
        return mapToGuidelinesDocumentResponse(findGuidelinesDocumentOwned(reporterId, documentId));
    }

    @Override
    @Transactional
    public GuidelinesDocumentResponse updateGuidelinesDocument(UUID reporterId, UUID documentId, UpdateGuidelinesDocumentRequest request) {
        GuidelinesDocument document = findGuidelinesDocumentOwned(reporterId, documentId);
        if (document.isPublic()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot update a published guidelines document");
        }
        document.setTitle(request.getTitle());
        document.setAbstractText(request.getAbstractText());
        if (request.getContent() != null) {
            String oldContent = document.getContent();
            document.setContent(uploadHtmlContent(request.getContent()));
            if (oldContent != null && !oldContent.isBlank()) objectStorage.deleteFile(bucketName, oldContent);
        }
        return mapToGuidelinesDocumentResponse(guidelinesDocumentRepository.save(document));
    }

    @Override
    @Transactional
    public GuidelinesDocumentResponse publishGuidelinesDocument(UUID reporterId, UUID documentId) {
        GuidelinesDocument document = findGuidelinesDocumentOwned(reporterId, documentId);
        if (document.isPublic()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Guidelines document is already published");
        }
        document.setPublic(true);
        GuidelinesDocumentResponse response = mapToGuidelinesDocumentResponse(guidelinesDocumentRepository.save(document));
        broadcast(TOPIC_GUIDELINE, "PUBLISHED", response.getId(), response.getTitle(), "guideline");
        return response;
    }

    @Override
    @Transactional
    public void deleteGuidelinesDocument(UUID reporterId, UUID documentId) {
        GuidelinesDocument document = findGuidelinesDocumentOwned(reporterId, documentId);
        String title = document.getTitle();
        guidelinesDocumentRepository.delete(document);
        broadcast(TOPIC_GUIDELINE, "DELETED", documentId, title, "guideline");
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GuidelinesDocumentResponse> listGuidelinesDocuments(UUID reporterId, Boolean isPublic, String title, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String titleParam = (title != null && !title.isBlank()) ? "%" + title.trim().toLowerCase() + "%" : null;
        return mapToPageResponse(
                guidelinesDocumentRepository.findByFilters(reporterId, isPublic, titleParam, pageRequest)
                        .map(this::mapToGuidelinesDocumentResponse));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private MissingPersonReport findMissingPersonReportOwned(UUID reporterId, UUID reportId) {
        return missingPersonReportRepository.findByReporterIdOrUserIdAndId(reporterId, reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Missing person report not found"));
    }

    private CrimeReport findCrimeReportOwned(UUID reporterId, UUID reportId) {
        return crimeReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crime report not found"));
    }

    private GuidelinesDocument findGuidelinesDocumentOwned(UUID reporterId, UUID documentId) {
        return guidelinesDocumentRepository.findByReporterIdAndId(reporterId, documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guidelines document not found"));
    }

    private MissingPersonReportResponse mapToMissingPersonReportResponse(MissingPersonReport report) {
        String statusName = report.getStatus() != null ? report.getStatus().getName() : null;
        return MissingPersonReportResponse.builder()
                .id(report.getId())
                .title(report.getTitle())
                .fullName(report.getFullName())
                .personalId(report.getPersonalId())
                .photo(report.getPhoto())
                .date(report.getDate())
                .content(report.getContent())
                .contentDocId(report.getContent())
                .contactEmail(report.getContactEmail())
                .contactPhone(report.getContactPhone())
                .latitude(report.getLatitude())
                .longitude(report.getLongitude())
                .createdAt(report.getCreatedAt())
                .userId(report.getUserId())
                .status(statusName)
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .publicFlag(ReportStatusConstants.PUBLISHED.equals(statusName))
                .build();
    }

    private CrimeReportResponse mapToCrimeReportResponse(CrimeReport report) {
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
                .publicFlag(report.isPublic())
                .build();
    }

    private GuidelinesDocumentResponse mapToGuidelinesDocumentResponse(GuidelinesDocument document) {
        return GuidelinesDocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .abstractText(document.getAbstractText())
                .content(document.getContent())
                .createdAt(document.getCreatedAt())
                .reporterId(document.getReporter() != null ? document.getReporter().getId() : null)
                .publicFlag(document.isPublic())
                .build();
    }

    private String uploadHtmlContent(String content) {
        String htmlBody = content == null ? "" : content;
        String htmlContent = "<!doctype html><html><head><meta charset=\"utf-8\"/></head><body>"
                + htmlBody + "</body></html>";
        String objectName = UUID.randomUUID() + ".html";
        try {
            objectStorage.uploadFile(
                    bucketName,
                    objectName,
                    "text/html; charset=UTF-8",
                    new ByteArrayInputStream(htmlContent.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception e) {
            log.error("Failed to upload content HTML: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to upload report content.");
        }
        return objectName;
    }

    private <T> PageResponse<T> mapToPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
