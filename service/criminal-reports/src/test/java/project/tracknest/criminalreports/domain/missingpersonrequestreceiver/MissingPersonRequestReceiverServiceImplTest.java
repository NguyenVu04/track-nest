package project.tracknest.criminalreports.domain.missingpersonrequestreceiver;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.datatype.ReportStatusConstants;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.core.entity.MissingPersonReportStatus;
import project.tracknest.criminalreports.core.entity.Reporter;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportStatusRepository;
import project.tracknest.criminalreports.domain.repository.ReporterRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MissingPersonRequestReceiverServiceImplTest {

    @Mock private MissingPersonReportRepository missingPersonReportRepository;
    @Mock private MissingPersonReportStatusRepository statusRepository;
    @Mock private ReporterRepository reporterRepository;

    @InjectMocks private MissingPersonRequestReceiverServiceImpl service;

    private static final UUID USER_ID     = UUID.randomUUID();
    private static final UUID REPORTER_ID = UUID.randomUUID();

    @BeforeEach
    void injectValues() {
        ReflectionTestUtils.setField(service, "bucketName", "criminal-reports");
        ReflectionTestUtils.setField(service, "publicUrl",  "http://localhost/file");
    }

    @Test
    void should_submitReport_whenReporterExists() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.of(status));
        when(missingPersonReportRepository.save(any())).thenAnswer(inv -> {
            MissingPersonReport r = inv.getArgument(0);
            return r;
        });

        MissingPersonReportResponse resp = service.submitMissingPersonReport(
                USER_ID, REPORTER_ID,
                "Missing Title", "John Doe", "ID123", null,
                "email@test.com", "+1234567890", LocalDate.now());

        assertThat(resp.getTitle()).isEqualTo("Missing Title");
        assertThat(resp.getUserId()).isEqualTo(USER_ID);
        assertThat(resp.getReporterId()).isEqualTo(REPORTER_ID);
        assertThat(resp.getStatus()).isEqualTo(ReportStatusConstants.PENDING);
        assertThat(resp.getContent()).contains("/index.html");
        assertThat(resp.isPublicFlag()).isFalse();
    }

    @Test
    void should_throw404_whenReporterNotFound() {
        when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submitMissingPersonReport(
                USER_ID, REPORTER_ID,
                "Title", "Name", "ID", null,
                null, "+1234567890", LocalDate.now()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void should_createPendingStatus_whenStatusNotFound() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.empty());
        when(statusRepository.save(any())).thenReturn(status);
        when(missingPersonReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.submitMissingPersonReport(
                USER_ID, REPORTER_ID,
                "Title", "Name", "ID", null,
                null, "+1234567890", LocalDate.now());

        verify(statusRepository).save(any());
    }

    @Test
    void should_useEmptyString_whenPhotoIsNull() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findById(REPORTER_ID)).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(any())).thenReturn(Optional.of(status));
        when(missingPersonReportRepository.save(any())).thenAnswer(inv -> {
            MissingPersonReport r = inv.getArgument(0);
            assertThat(r.getPhoto()).isEqualTo("");
            return r;
        });

        service.submitMissingPersonReport(USER_ID, REPORTER_ID,
                "T", "N", "I", null, null, "+1234567890", LocalDate.now());
    }
}
