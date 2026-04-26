package project.tracknest.criminalreports.domain.reportadmin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.GuidelinesDocument;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.GuidelinesDocumentRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportAdminServiceImplTest {

    @Mock private MissingPersonReportRepository missingPersonReportRepository;
    @Mock private CrimeReportRepository crimeReportRepository;
    @Mock private GuidelinesDocumentRepository guidelinesDocumentRepository;
    @Mock private ObjectStorage objectStorage;

    @InjectMocks private ReportAdminServiceImpl service;

    private static final UUID REPORT_ID = UUID.randomUUID();

    @BeforeEach
    void injectBucketName() {
        ReflectionTestUtils.setField(service, "bucketName", "criminal-reports");
    }

    @Test
    void should_deleteMissingPersonReport_andStorageFolder_whenFound() {
        MissingPersonReport report = MissingPersonReport.builder().id(REPORT_ID).build();
        when(missingPersonReportRepository.findById(REPORT_ID)).thenReturn(Optional.of(report));

        service.deleteMissingPersonReportAsAdmin(REPORT_ID);

        verify(missingPersonReportRepository).delete(report);
        verify(objectStorage).deleteFolder("criminal-reports", REPORT_ID + "/");
    }

    @Test
    void should_throw404_whenMissingPersonReportNotFound() {
        when(missingPersonReportRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteMissingPersonReportAsAdmin(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void should_deleteCrimeReport_andStorageFolder_whenFound() {
        CrimeReport report = CrimeReport.builder().id(REPORT_ID).build();
        when(crimeReportRepository.findById(REPORT_ID)).thenReturn(Optional.of(report));

        service.deleteCrimeReportAsAdmin(REPORT_ID);

        verify(crimeReportRepository).delete(report);
        verify(objectStorage).deleteFolder("criminal-reports", REPORT_ID + "/");
    }

    @Test
    void should_throw404_whenCrimeReportNotFound() {
        when(crimeReportRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCrimeReportAsAdmin(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void should_deleteGuidelinesDocument_andStorageFolder_whenFound() {
        GuidelinesDocument doc = GuidelinesDocument.builder().id(REPORT_ID).build();
        when(guidelinesDocumentRepository.findById(REPORT_ID)).thenReturn(Optional.of(doc));

        service.deleteGuidelinesDocumentAsAdmin(REPORT_ID);

        verify(guidelinesDocumentRepository).delete(doc);
        verify(objectStorage).deleteFolder("criminal-reports", REPORT_ID + "/");
    }

    @Test
    void should_throw404_whenGuidelinesDocumentNotFound() {
        when(guidelinesDocumentRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteGuidelinesDocumentAsAdmin(REPORT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

}
