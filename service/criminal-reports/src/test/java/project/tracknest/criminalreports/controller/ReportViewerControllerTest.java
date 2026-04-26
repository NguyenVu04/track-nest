package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.reportviewer.ReportViewerService;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportViewerController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportViewerControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private ReportViewerService service;

    private static final UUID REPORT_ID = UUID.randomUUID();
    private static final UUID DOC_ID    = UUID.randomUUID();
    private static final UUID REPORTER  = UUID.randomUUID();

    private MissingPersonReportResponse missingResponse() {
        return MissingPersonReportResponse.builder()
                .id(REPORT_ID).title("Alert").fullName("X").personalId("Y")
                .date(LocalDate.now()).contactPhone("+111").content("url").status("PUBLISHED")
                .createdAt(OffsetDateTime.now()).reporterId(REPORTER).publicFlag(true).build();
    }

    private CrimeReportResponse crimeResponse() {
        return CrimeReportResponse.builder()
                .id(REPORT_ID).title("Crime").severity(3).date(LocalDate.now())
                .longitude(0).latitude(0).content("url").reporterId(REPORTER)
                .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now()).publicFlag(true).build();
    }

    private GuidelinesDocumentResponse guidelineResponse() {
        return GuidelinesDocumentResponse.builder()
                .id(DOC_ID).title("G").abstractText("A").content("url")
                .createdAt(OffsetDateTime.now()).reporterId(REPORTER).publicFlag(true).build();
    }

    @Test
    void should_viewMissingPersonReport_return200() throws Exception {
        when(service.viewMissingPersonReport(REPORT_ID)).thenReturn(missingResponse());

        mockMvc.perform(get("/report-viewer/missing-person-reports/{id}", REPORT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(REPORT_ID.toString()));
    }

    @Test
    void should_viewMissingPersonReport_return404_whenNotFound() throws Exception {
        when(service.viewMissingPersonReport(REPORT_ID))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/report-viewer/missing-person-reports/{id}", REPORT_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_viewCrimeReport_return200() throws Exception {
        when(service.viewCrimeReport(REPORT_ID)).thenReturn(crimeResponse());

        mockMvc.perform(get("/report-viewer/crime-reports/{id}", REPORT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.severity").value(3));
    }

    @Test
    void should_viewCrimeReport_return404_whenNotFound() throws Exception {
        when(service.viewCrimeReport(REPORT_ID))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/report-viewer/crime-reports/{id}", REPORT_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_viewGuidelinesDocument_return200() throws Exception {
        when(service.viewGuidelinesDocument(DOC_ID)).thenReturn(guidelineResponse());

        mockMvc.perform(get("/report-viewer/guidelines/{id}", DOC_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("G"));
    }

    @Test
    void should_viewGuidelinesDocument_return404_whenNotFound() throws Exception {
        when(service.viewGuidelinesDocument(DOC_ID))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/report-viewer/guidelines/{id}", DOC_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_listMissingPersonReports_return200() throws Exception {
        when(service.listMissingPersonReports(anyBoolean(), anyInt(), anyInt()))
                .thenReturn(PageResponse.<MissingPersonReportResponse>builder()
                        .content(List.of(missingResponse())).page(0).size(10)
                        .totalElements(1).totalPages(1).first(true).last(true).build());

        mockMvc.perform(get("/report-viewer/missing-person-reports").param("isPublic", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void should_listCrimeReports_return200() throws Exception {
        when(service.listCrimeReports(anyBoolean(), anyInt(), anyInt()))
                .thenReturn(PageResponse.<CrimeReportResponse>builder()
                        .content(List.of()).page(0).size(10)
                        .totalElements(0).totalPages(0).first(true).last(true).build());

        mockMvc.perform(get("/report-viewer/crime-reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void should_listGuidelinesDocuments_return200() throws Exception {
        when(service.listGuidelinesDocuments(anyBoolean(), anyInt(), anyInt()))
                .thenReturn(PageResponse.<GuidelinesDocumentResponse>builder()
                        .content(List.of()).page(0).size(10)
                        .totalElements(0).totalPages(0).first(true).last(true).build());

        mockMvc.perform(get("/report-viewer/guidelines"))
                .andExpect(status().isOk());
    }

    @Test
    void should_capSizeAt100_forListEndpoints() throws Exception {
        when(service.listCrimeReports(anyBoolean(), anyInt(), eq(100)))
                .thenReturn(PageResponse.<CrimeReportResponse>builder()
                        .content(List.of()).page(0).size(100)
                        .totalElements(0).totalPages(0).first(true).last(true).build());

        mockMvc.perform(get("/report-viewer/crime-reports").param("size", "500"))
                .andExpect(status().isOk());

        verify(service).listCrimeReports(anyBoolean(), anyInt(), eq(100));
    }
}
