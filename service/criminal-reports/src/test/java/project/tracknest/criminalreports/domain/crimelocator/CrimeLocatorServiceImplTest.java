package project.tracknest.criminalreports.domain.crimelocator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.Reporter;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrimeLocatorServiceImplTest {

    @Mock private CrimeReportRepository crimeReportRepository;

    @InjectMocks private CrimeLocatorServiceImpl service;

    private static final UUID REPORTER_ID = UUID.randomUUID();

    private CrimeReport sampleCrimeReport(int severity) {
        return CrimeReport.builder()
                .id(UUID.randomUUID()).title("Crime").content("http://url/index.html")
                .severity(severity).date(LocalDate.now()).longitude(106.7).latitude(10.7)
                .numberOfVictims(1).numberOfOffenders(1).arrested(false)
                .photos(List.of()).reporter(Reporter.builder().id(REPORTER_ID).build()).isPublic(true)
                .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now()).build();
    }

    @Test
    void should_returnPagedHeatmap_whenReportsExist() {
        List<CrimeReport> crimes = List.of(sampleCrimeReport(4), sampleCrimeReport(2));
        when(crimeReportRepository.findAllPublicWithinRadius(anyDouble(), anyDouble(), anyDouble(), any(Pageable.class)))
                .thenAnswer(inv -> new PageImpl<>(crimes, inv.getArgument(3), crimes.size()));

        PageResponse<CrimeReportResponse> result = service.viewCrimeHeatmap(106.7, 10.7, 5000, 0, 20);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(20);
    }

    @Test
    void should_returnEmptyPage_whenNoReportsInRadius() {
        when(crimeReportRepository.findAllPublicWithinRadius(anyDouble(), anyDouble(), anyDouble(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        PageResponse<CrimeReportResponse> result = service.viewCrimeHeatmap(0.0, 0.0, 1000, 0, 10);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    void should_passRadiusAndCoordinates_toRepository() {
        when(crimeReportRepository.findAllPublicWithinRadius(eq(106.7), eq(10.7), eq(3000.0), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.viewCrimeHeatmap(106.7, 10.7, 3000.0, 0, 10);

        verify(crimeReportRepository).findAllPublicWithinRadius(eq(106.7), eq(10.7), eq(3000.0), any());
    }

    @Test
    void should_sortBySeverityDesc_inHeatmap() {
        when(crimeReportRepository.findAllPublicWithinRadius(anyDouble(), anyDouble(), anyDouble(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCrimeReport(5), sampleCrimeReport(1))));

        PageResponse<CrimeReportResponse> result = service.viewCrimeHeatmap(106.7, 10.7, 5000, 0, 10);
        assertThat(result.getContent().get(0).getSeverity()).isEqualTo(5);
    }
}
