package project.tracknest.criminalreports.domain.reportmanager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportManagerServiceImplTest {

    private static final String HTML_EXT = ".html";

    @Mock private MissingPersonReportRepository missingPersonReportRepository;
    @Mock private CrimeReportRepository crimeReportRepository;
    @Mock private GuidelinesDocumentRepository guidelinesDocumentRepository;
    @Mock private ReporterRepository reporterRepository;
    @Mock private MissingPersonReportStatusRepository statusRepository;
    @Mock private ObjectStorage objectStorage;

    @InjectMocks private ReportManagerServiceImpl service;

    private static final UUID REPORTER_ID = UUID.fromString("8c52c01e-42a7-45cc-9254-db8a7601c764");
    private static final UUID REPORT_ID   = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOC_ID      = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private final Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
    private final MissingPersonReportStatus pendingStatus   = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();
    private final MissingPersonReportStatus publishedStatus = MissingPersonReportStatus.builder().name(ReportStatusConstants.PUBLISHED).build();
    private final MissingPersonReportStatus rejectedStatus  = MissingPersonReportStatus.builder().name(ReportStatusConstants.REJECTED).build();

    @BeforeEach
    void injectValues() {
        ReflectionTestUtils.setField(service, "bucketName", "criminal-reports");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private MissingPersonReport pendingReport() {
        return MissingPersonReport.builder()
                .id(REPORT_ID).title("T").fullName("F").personalId("P").photo("")
                .date(LocalDate.now()).content("plain text content")
                .contactPhone("+1234567890").createdAt(OffsetDateTime.now())
                .userId(REPORTER_ID).reporter(reporter).status(pendingStatus).build();
    }

    private MissingPersonReport pendingReportWithPhoto(String photo) {
        return MissingPersonReport.builder()
                .id(REPORT_ID).title("T").fullName("F").personalId("P").photo(photo)
                .date(LocalDate.now()).content("plain text content")
                .contactPhone("+1234567890").createdAt(OffsetDateTime.now())
                .userId(REPORTER_ID).reporter(reporter).status(pendingStatus).build();
    }

    private CrimeReport privateCrimeReport() {
        return CrimeReport.builder()
                .id(REPORT_ID).title("Crime").content("plain text content")
                .severity(3).date(LocalDate.now()).longitude(106.7).latitude(10.7)
                .numberOfVictims(1).numberOfOffenders(1).arrested(false)
                .photos(List.of()).reporter(reporter).isPublic(false)
                .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now()).build();
    }

    private GuidelinesDocument privateGuideline() {
        return GuidelinesDocument.builder()
                .id(DOC_ID).title("G").abstractText("A")
                .content("plain text content")
                .isPublic(false).reporter(reporter).createdAt(OffsetDateTime.now()).build();
    }

    // ── Missing Person Reports ────────────────────────────────────────────────

    @Nested @DisplayName("createMissingPersonReport")
    class CreateMissingPersonReport {

        @Test
        void should_createReport_whenReporterExists() {
            when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
            when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.of(pendingStatus));
            when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = CreateMissingPersonReportRequest.builder()
                    .title("Alert").fullName("Jane").personalId("ID1")
                    .content("description text")
                    .date(LocalDate.now()).contactPhone("+1234567890").build();

            MissingPersonReportResponse resp = service.createMissingPersonReport(REPORTER_ID, req);

            assertThat(resp.getTitle()).isEqualTo("Alert");
            assertThat(resp.getStatus()).isEqualTo(ReportStatusConstants.PENDING);
            assertThat(resp.getContent()).isEqualTo("description text");
            verify(missingPersonReportRepository).save(any());
        }

        @Test
        void should_createReporter_whenReporterNotFound() {
            when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.empty());
            when(reporterRepository.save(any())).thenReturn(reporter);
            when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.of(pendingStatus));
            when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.createMissingPersonReport(REPORTER_ID,
                    CreateMissingPersonReportRequest.builder()
                            .title("T").fullName("F").personalId("P")
                            .date(LocalDate.now()).contactPhone("+1111111111").build());

            verify(reporterRepository).save(argThat(r -> r.getId().equals(REPORTER_ID)));
        }
    }

    @Nested @DisplayName("getMissingPersonReport")
    class GetMissingPersonReport {

        @Test
        void should_returnReport_whenOwned() {
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pendingReport()));

            MissingPersonReportResponse resp = service.getMissingPersonReport(REPORTER_ID, REPORT_ID);
            assertThat(resp.getId()).isEqualTo(REPORT_ID);
        }

        @Test
        void should_throw404_whenNotFound() {
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested @DisplayName("updateMissingPersonReport")
    class UpdateMissingPersonReport {

        @Test
        void should_updateReport_whenPending() {
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pendingReport()));
            when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = UpdateMissingPersonReportRequest.builder()
                    .title("Updated").fullName("New Name").personalId("NEW")
                    .content("updated text")
                    .date(LocalDate.now()).contactPhone("+9999999999").build();

            MissingPersonReportResponse resp = service.updateMissingPersonReport(REPORTER_ID, REPORT_ID, req);
            assertThat(resp.getTitle()).isEqualTo("Updated");
        }

        @Test
        void should_throw409_whenAlreadyPublished() {
            MissingPersonReport published = pendingReport();
            published.setStatus(publishedStatus);
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(published));

            var req = UpdateMissingPersonReportRequest.builder()
                    .title("X").fullName("X").personalId("X")
                    .date(LocalDate.now()).contactPhone("+1234567890").build();

            assertThatThrownBy(() -> service.updateMissingPersonReport(REPORTER_ID, REPORT_ID, req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }

        @Test
        void should_throw409_whenAlreadyRejected() {
            MissingPersonReport rejected = pendingReport();
            rejected.setStatus(rejectedStatus);
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(rejected));

            var req = UpdateMissingPersonReportRequest.builder()
                    .title("X").fullName("X").personalId("X")
                    .date(LocalDate.now()).contactPhone("+1234567890").build();

            assertThatThrownBy(() -> service.updateMissingPersonReport(REPORTER_ID, REPORT_ID, req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("publishMissingPersonReport")
    class PublishMissingPersonReport {

        @Test
        void should_publish_whenPending() {
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pendingReport()));
            when(statusRepository.findByName(ReportStatusConstants.PUBLISHED)).thenReturn(Optional.of(publishedStatus));
            when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            MissingPersonReportResponse resp = service.publishMissingPersonReport(REPORTER_ID, REPORT_ID);
            assertThat(resp.getStatus()).isEqualTo(ReportStatusConstants.PUBLISHED);
        }

        @Test
        void should_throw409_whenAlreadyPublished() {
            MissingPersonReport published = pendingReport();
            published.setStatus(publishedStatus);
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(published));

            assertThatThrownBy(() -> service.publishMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("rejectMissingPersonReport")
    class RejectMissingPersonReport {

        @Test
        void should_reject_whenPending() {
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pendingReport()));
            when(statusRepository.findByName(ReportStatusConstants.REJECTED)).thenReturn(Optional.of(rejectedStatus));
            when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            MissingPersonReportResponse resp = service.rejectMissingPersonReport(REPORTER_ID, REPORT_ID);
            assertThat(resp.getStatus()).isEqualTo(ReportStatusConstants.REJECTED);
        }

        @Test
        void should_throw409_whenAlreadyRejected() {
            MissingPersonReport rejected = pendingReport();
            rejected.setStatus(rejectedStatus);
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(rejected));

            assertThatThrownBy(() -> service.rejectMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("deleteMissingPersonReport")
    class DeleteMissingPersonReport {

        @Test
        void should_delete_whenOwned_andNoPhoto() {
            MissingPersonReport report = pendingReport();
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(report));

            service.deleteMissingPersonReport(REPORTER_ID, REPORT_ID);

            verify(missingPersonReportRepository).delete(report);
            verify(objectStorage, never()).deleteFile(any(), any());
        }

        @Test
        void should_deletePhotoFromStorage_whenPhotoPresent() {
            MissingPersonReport report = pendingReportWithPhoto("photo.png");
            when(missingPersonReportRepository.findByReporterIdOrUserIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(report));

            service.deleteMissingPersonReport(REPORTER_ID, REPORT_ID);

            verify(missingPersonReportRepository).delete(report);
            verify(objectStorage).deleteFile("criminal-reports", "photo.png");
        }

        @Test
        void should_throw404_whenNotFound() {
            assertThatThrownBy(() -> service.deleteMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested @DisplayName("listMissingPersonReports")
    class ListMissingPersonReports {

        @Test
        void should_filterByReporterAndStatus_whenBothProvided() {
            when(missingPersonReportRepository.findByReporterIdAndStatus(eq(REPORTER_ID), eq("PENDING"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(pendingReport())));

            var resp = service.listMissingPersonReports(REPORTER_ID, "PENDING", false, 0, 10);
            assertThat(resp.getContent()).hasSize(1);
        }

        @Test
        void should_filterPublishedByReporter_whenReporterAndIsPublic() {
            when(missingPersonReportRepository.findByReporterIdAndStatus(eq(REPORTER_ID), eq(ReportStatusConstants.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listMissingPersonReports(REPORTER_ID, null, true, 0, 10);
            verify(missingPersonReportRepository).findByReporterIdAndStatus(eq(REPORTER_ID), eq(ReportStatusConstants.PUBLISHED), any());
        }

        @Test
        void should_filterByReporterOnly_whenNoStatusOrPublic() {
            when(missingPersonReportRepository.findByReporterId(eq(REPORTER_ID), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listMissingPersonReports(REPORTER_ID, null, false, 0, 10);
            verify(missingPersonReportRepository).findByReporterId(eq(REPORTER_ID), any());
        }

        @Test
        void should_findAllPublic_whenNoReporterAndIsPublic() {
            when(missingPersonReportRepository.findAllPublic(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listMissingPersonReports(null, null, true, 0, 10);
            verify(missingPersonReportRepository).findAllPublic(any());
        }

        @Test
        void should_findAll_whenNoFilters() {
            when(missingPersonReportRepository.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listMissingPersonReports(null, null, false, 0, 10);
            verify(missingPersonReportRepository).findAll(any(Pageable.class));
        }
    }

    // ── Crime Reports ─────────────────────────────────────────────────────────

    @Nested @DisplayName("createCrimeReport")
    class CreateCrimeReport {

        @Test
        void should_createCrimeReport_withProvidedContent() {
            when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
            when(crimeReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = CreateCrimeReportRequest.builder()
                    .title("Robbery").severity(3).date(LocalDate.now())
                    .longitude(106.7).latitude(10.7).numberOfVictims(1).numberOfOffenders(1)
                    .content("robbery description")
                    .arrested(false).build();

            CrimeReportResponse resp = service.createCrimeReport(REPORTER_ID, req);

            assertThat(resp.getTitle()).isEqualTo("Robbery");
            assertThat(resp.getContent()).endsWith(HTML_EXT);
            assertThat(resp.isPublicFlag()).isFalse();
        }
    }

    @Nested @DisplayName("getCrimeReport")
    class GetCrimeReport {

        @Test
        void should_returnReport_whenOwned() {
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(privateCrimeReport()));

            CrimeReportResponse resp = service.getCrimeReport(REPORTER_ID, REPORT_ID);
            assertThat(resp.getId()).isEqualTo(REPORT_ID);
        }

        @Test
        void should_throw404_whenNotFound() {
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getCrimeReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested @DisplayName("updateCrimeReport")
    class UpdateCrimeReport {

        @Test
        void should_update_whenPrivate() {
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(privateCrimeReport()));
            when(crimeReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = UpdateCrimeReportRequest.builder()
                    .title("Updated").severity(4).date(LocalDate.now())
                    .numberOfVictims(2).numberOfOffenders(1).arrested(true).build();

            CrimeReportResponse resp = service.updateCrimeReport(REPORTER_ID, REPORT_ID, req);
            assertThat(resp.getTitle()).isEqualTo("Updated");
        }

        @Test
        void should_throw409_whenAlreadyPublic() {
            CrimeReport pub = privateCrimeReport();
            pub.setPublic(true);
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pub));

            var req = UpdateCrimeReportRequest.builder()
                    .title("X").severity(1).date(LocalDate.now()).build();

            assertThatThrownBy(() -> service.updateCrimeReport(REPORTER_ID, REPORT_ID, req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("publishCrimeReport")
    class PublishCrimeReport {

        @Test
        void should_publish_whenPrivate() {
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(privateCrimeReport()));
            when(crimeReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CrimeReportResponse resp = service.publishCrimeReport(REPORTER_ID, REPORT_ID);
            assertThat(resp.isPublicFlag()).isTrue();
        }

        @Test
        void should_throw409_whenAlreadyPublic() {
            CrimeReport pub = privateCrimeReport();
            pub.setPublic(true);
            when(crimeReportRepository.findByReporterIdAndId(REPORTER_ID, REPORT_ID))
                    .thenReturn(Optional.of(pub));

            assertThatThrownBy(() -> service.publishCrimeReport(REPORTER_ID, REPORT_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("listCrimeReports")
    class ListCrimeReports {

        @Test
        void should_filterByReporterAndMinSeverity_whenBothProvided() {
            when(crimeReportRepository.findByReporterIdAndMinSeverity(eq(REPORTER_ID), eq(3), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listCrimeReports(REPORTER_ID, 3, false, 0, 10);
            verify(crimeReportRepository).findByReporterIdAndMinSeverity(eq(REPORTER_ID), eq(3), any());
        }

        @Test
        void should_filterPublicByReporter_whenReporterAndIsPublic() {
            when(crimeReportRepository.findByReporterIdAndIsPublic(eq(REPORTER_ID), eq(true), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listCrimeReports(REPORTER_ID, null, true, 0, 10);
            verify(crimeReportRepository).findByReporterIdAndIsPublic(eq(REPORTER_ID), eq(true), any());
        }

        @Test
        void should_filterByReporterOnly_whenNoSeverityOrPublic() {
            when(crimeReportRepository.findByReporterId(eq(REPORTER_ID), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listCrimeReports(REPORTER_ID, null, false, 0, 10);
            verify(crimeReportRepository).findByReporterId(eq(REPORTER_ID), any());
        }

        @Test
        void should_findAllPublicWithSeverity_whenIsPublicAndMinSeverity() {
            when(crimeReportRepository.findAllPublicByMinSeverity(eq(3), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listCrimeReports(null, 3, true, 0, 10);
            verify(crimeReportRepository).findAllPublicByMinSeverity(eq(3), any());
        }

        @Test
        void should_findAllPublic_whenIsPublicAndNoSeverity() {
            when(crimeReportRepository.findAllPublic(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listCrimeReports(null, null, true, 0, 10);
            verify(crimeReportRepository).findAllPublic(any());
        }
    }

    // ── Guidelines Documents ─────────────────────────────────────────────────

    @Nested @DisplayName("createGuidelinesDocument")
    class CreateGuidelinesDocument {

        @Test
        void should_createDocument_withProvidedContent() {
            when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
            when(guidelinesDocumentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = CreateGuidelinesDocumentRequest.builder()
                    .title("Guide").abstractText("Abstract").content("guide content").isPublic(false).build();

            GuidelinesDocumentResponse resp = service.createGuidelinesDocument(REPORTER_ID, req);

            assertThat(resp.getTitle()).isEqualTo("Guide");
            assertThat(resp.getContent()).endsWith(HTML_EXT);
        }
    }

    @Nested @DisplayName("updateGuidelinesDocument")
    class UpdateGuidelinesDocument {

        @Test
        void should_update_whenPrivate() {
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.of(privateGuideline()));
            when(guidelinesDocumentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = UpdateGuidelinesDocumentRequest.builder()
                    .title("Updated").abstractText("New Abstract").build();

            GuidelinesDocumentResponse resp = service.updateGuidelinesDocument(REPORTER_ID, DOC_ID, req);
            assertThat(resp.getTitle()).isEqualTo("Updated");
        }

        @Test
        void should_throw409_whenAlreadyPublic() {
            GuidelinesDocument pub = privateGuideline();
            pub.setPublic(true);
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.of(pub));

            var req = UpdateGuidelinesDocumentRequest.builder()
                    .title("X").abstractText("X").build();

            assertThatThrownBy(() -> service.updateGuidelinesDocument(REPORTER_ID, DOC_ID, req))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("publishGuidelinesDocument")
    class PublishGuidelinesDocument {

        @Test
        void should_publish_whenPrivate() {
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.of(privateGuideline()));
            when(guidelinesDocumentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            GuidelinesDocumentResponse resp = service.publishGuidelinesDocument(REPORTER_ID, DOC_ID);
            assertThat(resp.isPublicFlag()).isTrue();
        }

        @Test
        void should_throw409_whenAlreadyPublic() {
            GuidelinesDocument pub = privateGuideline();
            pub.setPublic(true);
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.of(pub));

            assertThatThrownBy(() -> service.publishGuidelinesDocument(REPORTER_ID, DOC_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Nested @DisplayName("deleteGuidelinesDocument")
    class DeleteGuidelinesDocument {

        @Test
        void should_deleteDocumentOnly_withoutStorageCall() {
            GuidelinesDocument doc = privateGuideline();
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.of(doc));

            service.deleteGuidelinesDocument(REPORTER_ID, DOC_ID);

            verify(guidelinesDocumentRepository).delete(doc);
            verify(objectStorage, never()).deleteFolder(any(), any());
        }

        @Test
        void should_throw404_whenNotFound() {
            when(guidelinesDocumentRepository.findByReporterIdAndId(REPORTER_ID, DOC_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteGuidelinesDocument(REPORTER_ID, DOC_ID))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                            .isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested @DisplayName("listGuidelinesDocuments")
    class ListGuidelinesDocuments {

        @Test
        void should_filterPublicByReporter_whenReporterAndIsPublic() {
            when(guidelinesDocumentRepository.findByReporterIdAndIsPublic(eq(REPORTER_ID), eq(true), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listGuidelinesDocuments(REPORTER_ID, true, 0, 10);
            verify(guidelinesDocumentRepository).findByReporterIdAndIsPublic(eq(REPORTER_ID), eq(true), any());
        }

        @Test
        void should_filterByReporterOnly_whenReporterAndNotPublic() {
            when(guidelinesDocumentRepository.findByReporterId(eq(REPORTER_ID), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listGuidelinesDocuments(REPORTER_ID, false, 0, 10);
            verify(guidelinesDocumentRepository).findByReporterId(eq(REPORTER_ID), any());
        }

        @Test
        void should_findAllPublic_whenNoReporterAndIsPublic() {
            when(guidelinesDocumentRepository.findAllPublic(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listGuidelinesDocuments(null, true, 0, 10);
            verify(guidelinesDocumentRepository).findAllPublic(any());
        }
    }
}
