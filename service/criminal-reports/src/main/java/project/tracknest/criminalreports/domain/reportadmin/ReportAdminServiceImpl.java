package project.tracknest.criminalreports.domain.reportadmin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.criminalreports.core.entity.CrimeReport;
import project.tracknest.criminalreports.core.entity.GuidelinesDocument;
import project.tracknest.criminalreports.core.entity.MissingPersonReport;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.GuidelinesDocumentRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class ReportAdminServiceImpl implements ReportAdminService {

    private final MissingPersonReportRepository missingPersonReportRepository;
    private final CrimeReportRepository crimeReportRepository;
    private final GuidelinesDocumentRepository guidelinesDocumentRepository;

    @Override
    @Transactional
    public void deleteMissingPersonReportAsAdmin(UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Missing person report not found"));
        missingPersonReportRepository.delete(report);
        log.info("Deleted missing person report as admin: {}", reportId);
    }

    @Override
    @Transactional
    public void deleteCrimeReportAsAdmin(UUID reportId) {
        CrimeReport report = crimeReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Crime report not found"));
        crimeReportRepository.delete(report);
        log.info("Deleted crime report as admin: {}", reportId);
    }

    @Override
    @Transactional
    public void deleteGuidelinesDocumentAsAdmin(UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Guidelines document not found"));
        guidelinesDocumentRepository.delete(document);
        log.info("Deleted guidelines document as admin: {}", documentId);
    }
}
