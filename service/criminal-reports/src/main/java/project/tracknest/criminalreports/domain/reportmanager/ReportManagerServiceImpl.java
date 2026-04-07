package project.tracknest.criminalreports.domain.reportmanager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    
    private static final String DEFAULT_STATUS = ReportStatusConstants.PENDING;
    
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
                .content(request.getContent())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .userId(reporterId)
                .reporter(reporter)
                .status(status)
                .createdAt(OffsetDateTime.now())
                .build();
        
        MissingPersonReport saved = missingPersonReportRepository.save(report);
        return mapToMissingPersonReportResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public MissingPersonReportResponse getMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        return mapToMissingPersonReportResponse(report);
    }
    
    @Override
    @Transactional
    public MissingPersonReportResponse updateMissingPersonReport(UUID reporterId, UUID reportId, UpdateMissingPersonReportRequest request) {
        MissingPersonReport report = missingPersonReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        report.setTitle(request.getTitle());
        report.setFullName(request.getFullName());
        report.setPersonalId(request.getPersonalId());
        report.setPhoto(request.getPhoto() != null ? request.getPhoto() : report.getPhoto());
        report.setDate(request.getDate());
        report.setContent(request.getContent());
        report.setContactEmail(request.getContactEmail());
        report.setContactPhone(request.getContactPhone());
        MissingPersonReport saved = missingPersonReportRepository.save(report);
        return mapToMissingPersonReportResponse(saved);
    }

    @Override
    @Transactional
    public void deleteMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        missingPersonReportRepository.delete(report);
    }
    
    @Override
    @Transactional
    public MissingPersonReportResponse publishMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        
        MissingPersonReportStatus publishedStatus = statusRepository.findByName(ReportStatusConstants.PUBLISHED)
                .orElseThrow(() -> new RuntimeException("PUBLISHED status not found"));
        report.setStatus(publishedStatus);
        
        MissingPersonReport saved = missingPersonReportRepository.save(report);
        return mapToMissingPersonReportResponse(saved);
    }
    
    @Override
    @Transactional
    public MissingPersonReportResponse rejectMissingPersonReport(UUID reporterId, UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        MissingPersonReportStatus rejectedStatus = statusRepository.findByName(ReportStatusConstants.REJECTED)
                .orElseThrow(() -> new RuntimeException("REJECTED status not found"));
        report.setStatus(rejectedStatus);
        MissingPersonReport saved = missingPersonReportRepository.save(report);
        return mapToMissingPersonReportResponse(saved);
    }

    @Override
    @Transactional
    public void deleteMissingPersonReportAsAdmin(UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        missingPersonReportRepository.delete(report);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MissingPersonReportResponse> listMissingPersonReports(UUID reporterId, String status, boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MissingPersonReport> reports;
        
        if (reporterId != null) {
            if (status != null && !status.isEmpty()) {
                reports = missingPersonReportRepository.findByReporterIdAndStatus(reporterId, status, pageRequest);
            } else if (isPublic) {
                reports = missingPersonReportRepository.findByReporterIdAndStatus(reporterId, ReportStatusConstants.PUBLISHED, pageRequest);
            } else {
                reports = missingPersonReportRepository.findByReporterId(reporterId, pageRequest);
            }
        } else if (status != null && !status.isEmpty()) {
            reports = missingPersonReportRepository.findAllPublicByStatus(status, pageRequest);
        } else if (isPublic) {
            reports = missingPersonReportRepository.findAllPublic(pageRequest);
        } else {
            reports = missingPersonReportRepository.findAll(pageRequest);
        }
        
        return mapToPageResponse(reports.map(this::mapToMissingPersonReportResponse));
    }
    
    @Override
    @Transactional
    public CrimeReportResponse createCrimeReport(UUID reporterId, CreateCrimeReportRequest request) {
        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseGet(() -> reporterRepository.save(Reporter.builder().id(reporterId).build()));
        
        CrimeReport report = CrimeReport.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .severity(request.getSeverity())
                .date(request.getDate())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .numberOfVictims(request.getNumberOfVictims())
                .numberOfOffenders(request.getNumberOfOffenders())
                .arrested(request.isArrested())
                .reporter(reporter)
                .isPublic(false)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        
        CrimeReport saved = crimeReportRepository.save(report);
        return mapToCrimeReportResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public CrimeReportResponse getCrimeReport(UUID reporterId, UUID reportId) {
        CrimeReport report = crimeReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        return mapToCrimeReportResponse(report);
    }

    @Override
    @Transactional
    public CrimeReportResponse updateCrimeReport(UUID reporterId, UUID reportId, UpdateCrimeReportRequest request) {
        CrimeReport report = crimeReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        report.setTitle(request.getTitle());
        report.setContent(request.getContent());
        report.setSeverity(request.getSeverity());
        report.setDate(request.getDate());
        report.setNumberOfVictims(request.getNumberOfVictims());
        report.setNumberOfOffenders(request.getNumberOfOffenders());
        report.setArrested(request.isArrested());
        report.setUpdatedAt(OffsetDateTime.now());
        CrimeReport saved = crimeReportRepository.save(report);
        return mapToCrimeReportResponse(saved);
    }

    @Override
    @Transactional
    public CrimeReportResponse publishCrimeReport(UUID reporterId, UUID reportId) {
        CrimeReport report = crimeReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        report.setPublic(true);
        CrimeReport saved = crimeReportRepository.save(report);
        return mapToCrimeReportResponse(saved);
    }
    
    @Override
    @Transactional
    public void deleteCrimeReport(UUID reporterId, UUID reportId) {
        CrimeReport report = crimeReportRepository.findByReporterIdAndId(reporterId, reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        crimeReportRepository.delete(report);
    }
    
    @Override
    @Transactional
    public void deleteCrimeReportAsAdmin(UUID reportId) {
        CrimeReport report = crimeReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        crimeReportRepository.delete(report);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> listCrimeReports(UUID reporterId, Integer minSeverity, boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CrimeReport> reports;
        
        if (reporterId != null) {
            if (minSeverity != null) {
                reports = crimeReportRepository.findByReporterIdAndMinSeverity(reporterId, minSeverity, pageRequest);
            } else if (isPublic) {
                reports = crimeReportRepository.findAllPublic(pageRequest);
            } else {
                reports = crimeReportRepository.findByReporterId(reporterId, pageRequest);
            }
        } else if (isPublic) {
            reports = minSeverity != null
                    ? crimeReportRepository.findAllPublicByMinSeverity(minSeverity, pageRequest)
                    : crimeReportRepository.findAllPublic(pageRequest);
        } else if (minSeverity != null) {
            reports = crimeReportRepository.findAllByMinSeverity(minSeverity, pageRequest);
        } else {
            reports = crimeReportRepository.findAll(pageRequest);
        }
        
        return mapToPageResponse(reports.map(this::mapToCrimeReportResponse));
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> listCrimeReportsWithinRadius(double longitude, double latitude, double radius, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<CrimeReport> reports = crimeReportRepository.findAllPublicWithinRadius(longitude, latitude, radius, pageRequest);
        return mapToPageResponse(reports.map(this::mapToCrimeReportResponse));
    }
    
    @Override
    @Transactional
    public GuidelinesDocumentResponse createGuidelinesDocument(UUID reporterId, CreateGuidelinesDocumentRequest request) {
        Reporter reporter = reporterRepository.findById(reporterId)
                .orElseGet(() -> reporterRepository.save(Reporter.builder().id(reporterId).build()));
        
        GuidelinesDocument document = GuidelinesDocument.builder()
                .title(request.getTitle())
                .abstractText(request.getAbstractText())
                .content(request.getContent())
                .isPublic(request.isPublic())
                .reporter(reporter)
                .createdAt(OffsetDateTime.now())
                .build();
        
        GuidelinesDocument saved = guidelinesDocumentRepository.save(document);
        return mapToGuidelinesDocumentResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public GuidelinesDocumentResponse getGuidelinesDocument(UUID reporterId, UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findByReporterIdAndId(reporterId, documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        return mapToGuidelinesDocumentResponse(document);
    }
    
    @Override
    @Transactional
    public GuidelinesDocumentResponse updateGuidelinesDocument(UUID reporterId, UUID documentId, UpdateGuidelinesDocumentRequest request) {
        GuidelinesDocument document = guidelinesDocumentRepository.findByReporterIdAndId(reporterId, documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        document.setTitle(request.getTitle());
        document.setAbstractText(request.getAbstractText());
        document.setContent(request.getContent());
        GuidelinesDocument saved = guidelinesDocumentRepository.save(document);
        return mapToGuidelinesDocumentResponse(saved);
    }

    @Override
    @Transactional
    public GuidelinesDocumentResponse publishGuidelinesDocument(UUID reporterId, UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findByReporterIdAndId(reporterId, documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        document.setPublic(true);
        GuidelinesDocument saved = guidelinesDocumentRepository.save(document);
        return mapToGuidelinesDocumentResponse(saved);
    }
    
    @Override
    @Transactional
    public void deleteGuidelinesDocument(UUID reporterId, UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findByReporterIdAndId(reporterId, documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        guidelinesDocumentRepository.delete(document);
    }
    
    @Override
    @Transactional
    public void deleteGuidelinesDocumentAsAdmin(UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        guidelinesDocumentRepository.delete(document);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<GuidelinesDocumentResponse> listGuidelinesDocuments(UUID reporterId, boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GuidelinesDocument> documents;
        
        if (reporterId != null) {
            if (isPublic) {
                documents = guidelinesDocumentRepository.findAllPublic(pageRequest);
            } else {
                documents = guidelinesDocumentRepository.findByReporterId(reporterId, pageRequest);
            }
        } else if (isPublic) {
            documents = guidelinesDocumentRepository.findAllPublic(pageRequest);
        } else {
            documents = guidelinesDocumentRepository.findAll(pageRequest);
        }
        
        return mapToPageResponse(documents.map(this::mapToGuidelinesDocumentResponse));
    }
    
    private MissingPersonReportResponse mapToMissingPersonReportResponse(MissingPersonReport report) {
        String statusName = report.getStatus() != null ? report.getStatus().getName() : null;
        boolean isPublished = ReportStatusConstants.PUBLISHED.equals(statusName);
        
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
                .status(statusName)
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .publicFlag(isPublished)
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
