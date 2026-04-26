package project.tracknest.criminalreports.domain.reportadmin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
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
    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @Override
    @Transactional
    public void deleteMissingPersonReportAsAdmin(UUID reportId) {
        MissingPersonReport report = missingPersonReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Missing person report not found"));
        missingPersonReportRepository.delete(report);
        objectStorage.deleteFolder(bucketName, reportId + "/");
        log.info("Deleted missing person report as admin: {}", reportId);
    }

    @Override
    @Transactional
    public void deleteCrimeReportAsAdmin(UUID reportId) {
        CrimeReport report = crimeReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crime report not found"));
        crimeReportRepository.delete(report);
        objectStorage.deleteFolder(bucketName, reportId + "/");
        log.info("Deleted crime report as admin: {}", reportId);
    }

    @Override
    @Transactional
    public void deleteGuidelinesDocumentAsAdmin(UUID documentId) {
        GuidelinesDocument document = guidelinesDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guidelines document not found"));
        guidelinesDocumentRepository.delete(document);
        objectStorage.deleteFolder(bucketName, documentId + "/");
        log.info("Deleted guidelines document as admin: {}", documentId);
    }
}
