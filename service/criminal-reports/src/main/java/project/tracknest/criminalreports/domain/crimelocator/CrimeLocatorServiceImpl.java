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

    private final CrimeReportRepository crimeReportRepository;
    private static final double HIGH_RISK_RADIUS_METERS = 1000.0;
    private static final int HIGH_RISK_MIN_SEVERITY = 4;

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
    public boolean isHighRiskZone(double longitude, double latitude) {
        long count = crimeReportRepository.countPublicWithinRadiusWithMinSeverity(
                longitude,
                latitude,
                HIGH_RISK_RADIUS_METERS,
                HIGH_RISK_MIN_SEVERITY);
        return count > 0;
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
