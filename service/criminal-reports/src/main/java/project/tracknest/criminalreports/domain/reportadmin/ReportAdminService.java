package project.tracknest.criminalreports.domain.reportadmin;

import java.util.UUID;

public interface ReportAdminService {
    void deleteMissingPersonReportAsAdmin(UUID reportId);
    void deleteCrimeReportAsAdmin(UUID reportId);
    void deleteGuidelinesDocumentAsAdmin(UUID documentId);
}
