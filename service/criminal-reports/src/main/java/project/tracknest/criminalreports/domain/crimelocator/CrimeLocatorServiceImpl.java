package project.tracknest.criminalreports.domain.crimelocator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;

@Service
@RequiredArgsConstructor
@Slf4j
class CrimeLocatorServiceImpl implements CrimeLocatorService {

    private static final int HIGH_RISK_SEVERITY_THRESHOLD = 4;
    private static final double HIGH_RISK_RADIUS_METERS = 1000;

    private final CrimeReportRepository crimeReportRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CrimeReportResponse> viewCrimeHeatmap(double longitude, double latitude, double radius, int page, int size) {
        log.info("Viewing crime heatmap around ({}, {}) with radius {}m", longitude, latitude, radius);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "severity"));
        Page<CrimeReport> reports = crimeReportRepository.findAllPublicWithinRadius(longitude, latitude, radius, pageRequest);
        return mapToPageResponse(reports.map(this::mapToCrimeReportResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkIfInsideHighRiskCrimeZone(double longitude, double latitude) {
        log.info("Checking if location ({}, {}) is in high-risk crime zone", longitude, latitude);
        PageRequest pageRequest = PageRequest.of(0, 100);
        Page<CrimeReport> nearbyReports = crimeReportRepository.findAllPublicWithinRadius(
                longitude, latitude, HIGH_RISK_RADIUS_METERS, pageRequest);

        boolean hasHighRiskCrime = nearbyReports.getContent().stream()
                .anyMatch(report -> report.getSeverity() >= HIGH_RISK_SEVERITY_THRESHOLD);

        return hasHighRiskCrime;
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
