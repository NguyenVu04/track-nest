package project.tracknest.criminalreports.domain.crimelocator;

import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;

public interface CrimeLocatorService {
    PageResponse<CrimeReportResponse> viewCrimeHeatmap(double longitude, double latitude, double radius, int page, int size);
}
