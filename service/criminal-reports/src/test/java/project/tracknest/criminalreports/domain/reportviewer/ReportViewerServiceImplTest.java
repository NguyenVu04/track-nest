package project.tracknest.criminalreports.domain.reportviewer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.datatype.ReportStatusConstants;
import project.tracknest.criminalreports.core.entity.*;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.repository.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportViewerServiceImplTest {

    @Mock private MissingPersonReportRepository missingPersonReportRepository;
    @Mock private CrimeReportRepository crimeReportRepository;
    @Mock private GuidelinesDocumentRepository guidelinesDocumentRepository;

    @InjectMocks private ReportViewerServiceImpl service;

    private static final UUID REPORT_ID   = UUID.randomUUID();
    private static final UUID REPORTER_ID = UUID.randomUUID();

    private final Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
    private final MissingPersonReportStatus published =
            MissingPersonReportStatus.builder().name(ReportStatusConstants.PUBLISHED).build();

    private MissingPersonReport sampleMissingReport() {
        return MissingPersonReport.builder()
                .id(REPORT_ID).title("Missing").fullName("John").personalId("ID")
                .photo("").date(LocalDate.now()).content("http://url/index.html")
                .contactPhone("+1234567890").createdAt(OffsetDateTime.now())
                .userId(REPORTER_ID).reporter(reporter).status(published).build();
    }

    private CrimeReport sampleCrimeReport() {
        return CrimeReport.builder()
                .id(REPORT_ID).title("Crime").content("http://url/index.html")
                .severity(3).date(LocalDate.now()).longitude(106.7).latitude(10.7)
                .numberOfVictims(1).numberOfOffenders(1).arrested(false)
                .photos(List.of()).reporter(reporter).isPublic(true)
                .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now()).build();
    }

    private GuidelinesDocument sampleGuideline() {
        return GuidelinesDocument.builder()
                .id(REPORT_ID).title("Guide").abstractText("Abstract")
                .content("http://url/index.html").isPublic(true)
                .reporter(reporter).createdAt(OffsetDateTime.now()).build();
    }

    // ── viewMissingPersonReport ───────────────────────────────────────────────

    @Test
    void should_viewMissingPersonReport_whenExists() {
        when(missingPersonReportRepository.findById(REPORT_ID)).thenReturn(Optional.of(sampleMissingReport()));

        MissingPersonReportResponse resp = service.viewMissingPersonReport(REPORT_ID);
        assertThat(resp.getId()).isEqualTo(REPORT_ID);
        assertThat(resp.getTitle()).isEqualTo("Missing");
    }

    @Test
    void should_throw404_whenMissingPersonReportNotFound() {
        when(missingPersonReportRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.viewMissingPersonReport(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ── viewCrimeReport ───────────────────────────────────────────────────────

    @Test
    void should_viewCrimeReport_whenExists() {
        when(crimeReportRepository.findById(REPORT_ID)).thenReturn(Optional.of(sampleCrimeReport()));

        CrimeReportResponse resp = service.viewCrimeReport(REPORT_ID);
        assertThat(resp.getId()).isEqualTo(REPORT_ID);
    }

    @Test
    void should_throw404_whenCrimeReportNotFound() {
        when(crimeReportRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.viewCrimeReport(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ── viewGuidelinesDocument ────────────────────────────────────────────────

    @Test
    void should_viewGuidelinesDocument_whenExists() {
        when(guidelinesDocumentRepository.findById(REPORT_ID)).thenReturn(Optional.of(sampleGuideline()));

        GuidelinesDocumentResponse resp = service.viewGuidelinesDocument(REPORT_ID);
        assertThat(resp.getId()).isEqualTo(REPORT_ID);
    }

    @Test
    void should_throw404_whenGuidelinesDocumentNotFound() {
        when(guidelinesDocumentRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.viewGuidelinesDocument(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ── list methods ──────────────────────────────────────────────────────────

    @Test
    void should_listPublicMissingPersonReports_whenIsPublicTrue() {
        when(missingPersonReportRepository.findAllPublic(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleMissingReport())));

        var resp = service.listMissingPersonReports(true, 0, 10);
        assertThat(resp.getContent()).hasSize(1);
        verify(missingPersonReportRepository).findAllPublic(any());
    }

    @Test
    void should_listAllMissingPersonReports_whenIsPublicFalse() {
        when(missingPersonReportRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.listMissingPersonReports(false, 0, 10);
        verify(missingPersonReportRepository).findAll(any(Pageable.class));
    }

    @Test
    void should_listPublicCrimeReports_whenIsPublicTrue() {
        when(crimeReportRepository.findAllPublic(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCrimeReport())));

        var resp = service.listCrimeReports(true, 0, 10);
        assertThat(resp.getContent()).hasSize(1);
    }

    @Test
    void should_listPublicGuidelinesDocuments_whenIsPublicTrue() {
        when(guidelinesDocumentRepository.findAllPublic(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleGuideline())));

        var resp = service.listGuidelinesDocuments(true, 0, 10);
        assertThat(resp.getContent()).hasSize(1);
    }

}
