package project.tracknest.criminalreports.domain.missingpersonrequestreceiver;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
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
    @Mock private EntityManager entityManager;

    @InjectMocks private MissingPersonRequestReceiverServiceImpl service;

    private static final UUID USER_ID     = UUID.randomUUID();
    private static final UUID REPORTER_ID = UUID.randomUUID();

    @Test
    void should_submitReport() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findFirstByOrderByLastAssignedAtAsc()).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.of(status));
        when(missingPersonReportRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(entityManager).refresh(any());

        MissingPersonReportResponse resp = service.submitMissingPersonReport(
                USER_ID,
                "Missing Title", "John Doe", "ID123",
                "additional details",
                null,
                "email@test.com", "+1234567890", LocalDate.now());

        assertThat(resp.getTitle()).isEqualTo("Missing Title");
        assertThat(resp.getUserId()).isEqualTo(USER_ID);
        assertThat(resp.getReporterId()).isEqualTo(REPORTER_ID);
        assertThat(resp.getStatus()).isEqualTo(ReportStatusConstants.PENDING);
        assertThat(resp.getContent()).isEqualTo("additional details");
        assertThat(resp.isPublicFlag()).isFalse();
    }

    @Test
    void should_createPendingStatus_whenStatusNotFound() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findFirstByOrderByLastAssignedAtAsc()).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(ReportStatusConstants.PENDING)).thenReturn(Optional.empty());
        when(statusRepository.save(any())).thenReturn(status);
        when(missingPersonReportRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(entityManager).refresh(any());

        service.submitMissingPersonReport(
                USER_ID,
                "Title", "Name", "ID", null,
                null, null, "+1234567890", LocalDate.now());

        verify(statusRepository).save(any());
    }

    @Test
    void should_useEmptyString_whenPhotoIsNull() {
        Reporter reporter = Reporter.builder().id(REPORTER_ID).build();
        MissingPersonReportStatus status = MissingPersonReportStatus.builder().name(ReportStatusConstants.PENDING).build();

        when(reporterRepository.findFirstByOrderByLastAssignedAtAsc()).thenReturn(Optional.of(reporter));
        when(statusRepository.findByName(any())).thenReturn(Optional.of(status));
        when(missingPersonReportRepository.saveAndFlush(any())).thenAnswer(inv -> {
            MissingPersonReport r = inv.getArgument(0);
            assertThat(r.getPhoto()).isEqualTo("");
            return r;
        });
        doNothing().when(entityManager).refresh(any());

        service.submitMissingPersonReport(USER_ID,
                "T", "N", "I", null, null, null, "+1234567890", LocalDate.now());
    }
}
