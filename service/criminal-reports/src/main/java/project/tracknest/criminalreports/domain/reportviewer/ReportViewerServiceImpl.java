package project.tracknest.criminalreports.domain.reportviewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.GuidelinesDocument;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.GuidelinesDocumentRepository;
import project.tracknest.criminalreports.core.datatype.ReportStatusConstants;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class ReportViewerServiceImpl implements ReportViewerService {

    private final MissingPersonReportRepository missingPersonReportRepository;
    private final CrimeReportRepository crimeReportRepository;
    private final GuidelinesDocumentRepository guidelinesDocumentRepository;

    @Override
    @Transactional(readOnly = true)
    public MissingPersonReportResponse viewMissingPersonReport(UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Missing person report not found"));
        return mapToMissingPersonReportResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public CrimeReportResponse viewCrimeReport(UUID reportId) {
        CrimeReport report = crimeReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crime report not found"));
        return mapToCrimeReportResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public GuidelinesDocumentResponse viewGuidelinesDocument(UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guidelines document not found"));
        return mapToGuidelinesDocumentResponse(document);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MissingPersonReportResponse> listMissingPersonReports(boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MissingPersonReport> reports;

        if (isPublic) {
            reports = missingPersonReportRepository.findAllPublic(pageRequest);
        } else {
            reports = missingPersonReportRepository.findAll(pageRequest);
        }

        return mapToPageResponse(reports.map(this::mapToMissingPersonReportResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> listCrimeReports(boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CrimeReport> reports;

        if (isPublic) {
            reports = crimeReportRepository.findAllPublic(pageRequest);
        } else {
            reports = crimeReportRepository.findAll(pageRequest);
        }

        return mapToPageResponse(reports.map(this::mapToCrimeReportResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GuidelinesDocumentResponse> listGuidelinesDocuments(boolean isPublic, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GuidelinesDocument> documents;

        if (isPublic) {
            documents = guidelinesDocumentRepository.findAllPublic(pageRequest);
        } else {
            documents = guidelinesDocumentRepository.findAll(pageRequest);
        }

        return mapToPageResponse(documents.map(this::mapToGuidelinesDocumentResponse));
    }

    private MissingPersonReportResponse mapToMissingPersonReportResponse(MissingPersonReport report) {
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
                .status(report.getStatus() != null ? report.getStatus().getName() : null)
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .publicFlag(report.getStatus() != null && ReportStatusConstants.PUBLISHED.equals(report.getStatus().getName()))
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
