package project.tracknest.criminalreports.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.ReportManagerService;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.utils.SecuritySetup;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportManagerController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportManagerControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean  private ReportManagerService service;
    @MockBean  private ObjectStorage objectStorage;

    private static final UUID REPORTER_ID = SecuritySetup.REPORTER_USER_ID;
    private static final UUID REPORT_ID   = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOC_ID      = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setupSecurity() {
        SecuritySetup.setUpReporterSecurityContext();
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private MissingPersonReportResponse sampleMissingResponse() {
        return MissingPersonReportResponse.builder()
                .id(REPORT_ID).title("Alert").fullName("Jane").personalId("ID1")
                .date(LocalDate.now()).contactPhone("+1234567890")
                .content("some description").status("PENDING")
                .createdAt(OffsetDateTime.now()).userId(REPORTER_ID).reporterId(REPORTER_ID)
                .publicFlag(false).build();
    }

    private MissingPersonReportResponse sampleMissingResponseWithPhoto(String photo) {
        return MissingPersonReportResponse.builder()
                .id(REPORT_ID).title("Alert").fullName("Jane").personalId("ID1")
                .date(LocalDate.now()).contactPhone("+1234567890").photo(photo)
                .content("some description").status("PENDING")
                .createdAt(OffsetDateTime.now()).userId(REPORTER_ID).reporterId(REPORTER_ID)
                .publicFlag(false).build();
    }

    private CrimeReportResponse sampleCrimeResponse() {
        return CrimeReportResponse.builder()
                .id(REPORT_ID).title("Crime").content("some description")
                .severity(3).date(LocalDate.now()).longitude(106.7).latitude(10.7)
                .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now())
                .reporterId(REPORTER_ID).publicFlag(false).build();
    }

    private GuidelinesDocumentResponse sampleGuidelineResponse() {
        return GuidelinesDocumentResponse.builder()
                .id(DOC_ID).title("Guide").abstractText("Abstract").content("some description")
                .createdAt(OffsetDateTime.now()).reporterId(REPORTER_ID).publicFlag(false).build();
    }

    // ── Missing Person Reports ────────────────────────────────────────────────

    @Nested @DisplayName("POST /report-manager/missing-person-reports")
    class CreateMissingPersonReport {

        @Test
        void should_return200_whenValidRequest() throws Exception {
            when(service.createMissingPersonReport(eq(REPORTER_ID), any())).thenReturn(sampleMissingResponse());

            mockMvc.perform(post("/report-manager/missing-person-reports")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    CreateMissingPersonReportRequest.builder()
                                            .title("Alert").fullName("Jane").personalId("ID1")
                                            .date(LocalDate.now()).contactPhone("+1234567890").build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(REPORT_ID.toString()))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        void should_return400_whenTitleBlank() throws Exception {
            mockMvc.perform(post("/report-manager/missing-person-reports")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    CreateMissingPersonReportRequest.builder()
                                            .title("").fullName("Jane").personalId("ID1")
                                            .date(LocalDate.now()).contactPhone("+1234567890").build())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("GET /report-manager/missing-person-reports/{reportId}")
    class GetMissingPersonReport {

        @Test
        void should_return200_whenFound() throws Exception {
            when(service.getMissingPersonReport(REPORTER_ID, REPORT_ID)).thenReturn(sampleMissingResponse());

            mockMvc.perform(get("/report-manager/missing-person-reports/{id}", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(REPORT_ID.toString()));
        }

        @Test
        void should_return404_whenNotFound() throws Exception {
            when(service.getMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

            mockMvc.perform(get("/report-manager/missing-person-reports/{id}", REPORT_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("GET /report-manager/missing-person-reports/{reportId}/photo")
    class GetMissingPersonReportPhoto {

        @Test
        void should_return200_withImageBytes_whenPhotoExists() throws Exception {
            when(service.getMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .thenReturn(sampleMissingResponseWithPhoto("uuid.png"));
            when(objectStorage.downloadFile(any(), eq("uuid.png")))
                    .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

            mockMvc.perform(get("/report-manager/missing-person-reports/{id}/photo", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", "image/png"))
                    .andExpect(header().string("Cache-Control", "public, max-age=86400"));
        }

        @Test
        void should_return404_whenPhotoBlank() throws Exception {
            when(service.getMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .thenReturn(sampleMissingResponseWithPhoto(""));

            mockMvc.perform(get("/report-manager/missing-person-reports/{id}/photo", REPORT_ID))
                    .andExpect(status().isNotFound());
        }

        @Test
        void should_return404_whenStorageThrows() throws Exception {
            when(service.getMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .thenReturn(sampleMissingResponseWithPhoto("uuid.png"));
            when(objectStorage.downloadFile(any(), eq("uuid.png")))
                    .thenThrow(new RuntimeException("Not found in storage"));

            mockMvc.perform(get("/report-manager/missing-person-reports/{id}/photo", REPORT_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("POST /report-manager/missing-person-reports/{id}/publish")
    class PublishMissingPersonReport {

        @Test
        void should_return200_whenPublished() throws Exception {
            MissingPersonReportResponse published = sampleMissingResponse();
            published.setStatus("PUBLISHED");
            published.setPublicFlag(true);
            when(service.publishMissingPersonReport(REPORTER_ID, REPORT_ID)).thenReturn(published);

            mockMvc.perform(post("/report-manager/missing-person-reports/{id}/publish", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isPublic").value(true));
        }

        @Test
        void should_return409_whenAlreadyPublished() throws Exception {
            when(service.publishMissingPersonReport(REPORTER_ID, REPORT_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(post("/report-manager/missing-person-reports/{id}/publish", REPORT_ID))
                    .andExpect(status().isConflict());
        }
    }

    @Nested @DisplayName("POST /report-manager/missing-person-reports/{id}/reject")
    class RejectMissingPersonReport {

        @Test
        void should_return200_whenRejected() throws Exception {
            MissingPersonReportResponse rejected = sampleMissingResponse();
            rejected.setStatus("REJECTED");
            when(service.rejectMissingPersonReport(REPORTER_ID, REPORT_ID)).thenReturn(rejected);

            mockMvc.perform(post("/report-manager/missing-person-reports/{id}/reject", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("REJECTED"));
        }
    }

    @Nested @DisplayName("DELETE /report-manager/missing-person-reports/{id}")
    class DeleteMissingPersonReport {

        @Test
        void should_return204_whenDeleted() throws Exception {
            doNothing().when(service).deleteMissingPersonReport(REPORTER_ID, REPORT_ID);

            mockMvc.perform(delete("/report-manager/missing-person-reports/{id}", REPORT_ID))
                    .andExpect(status().isNoContent());
        }

        @Test
        void should_return404_whenNotFound() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                    .when(service).deleteMissingPersonReport(REPORTER_ID, REPORT_ID);

            mockMvc.perform(delete("/report-manager/missing-person-reports/{id}", REPORT_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("GET /report-manager/missing-person-reports")
    class ListMissingPersonReports {

        @Test
        void should_return200_withDefaultPagination() throws Exception {
            when(service.listMissingPersonReports(any(), any(), any(), anyBoolean(), anyInt(), anyInt()))
                    .thenReturn(PageResponse.<MissingPersonReportResponse>builder()
                            .content(List.of()).page(0).size(10).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/missing-person-reports"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        void should_capSizeAt100() throws Exception {
            when(service.listMissingPersonReports(any(), any(), any(), anyBoolean(), anyInt(), eq(100)))
                    .thenReturn(PageResponse.<MissingPersonReportResponse>builder()
                            .content(List.of()).page(0).size(100).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/missing-person-reports").param("size", "999"))
                    .andExpect(status().isOk());

            verify(service).listMissingPersonReports(any(), any(), any(), anyBoolean(), anyInt(), eq(100));
        }
    }

    // ── Crime Reports ─────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /report-manager/crime-reports")
    class CreateCrimeReport {

        @Test
        void should_return200_whenValidRequest() throws Exception {
            when(service.createCrimeReport(eq(REPORTER_ID), any())).thenReturn(sampleCrimeResponse());

            mockMvc.perform(multipart("/report-manager/crime-reports")
                            .param("title", "Crime")
                            .param("severity", "3")
                            .param("date", LocalDate.now().toString())
                            .param("longitude", "106.7")
                            .param("latitude", "10.7"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(REPORT_ID.toString()));
        }

        @Test
        void should_return400_whenRequiredParamMissing() throws Exception {
            // 'title' is a required @RequestParam — omitting it triggers MissingServletRequestParameterException → 400
            mockMvc.perform(multipart("/report-manager/crime-reports")
                            .param("severity", "3")
                            .param("date", LocalDate.now().toString())
                            .param("longitude", "106.7")
                            .param("latitude", "10.7"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("POST /report-manager/crime-reports/{id}/publish")
    class PublishCrimeReport {

        @Test
        void should_return200_whenPublished() throws Exception {
            CrimeReportResponse pub = sampleCrimeResponse();
            pub.setPublicFlag(true);
            when(service.publishCrimeReport(REPORTER_ID, REPORT_ID)).thenReturn(pub);

            mockMvc.perform(post("/report-manager/crime-reports/{id}/publish", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isPublic").value(true));
        }

        @Test
        void should_return409_whenAlreadyPublic() throws Exception {
            when(service.publishCrimeReport(REPORTER_ID, REPORT_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(post("/report-manager/crime-reports/{id}/publish", REPORT_ID))
                    .andExpect(status().isConflict());
        }
    }

    @Nested @DisplayName("PUT /report-manager/crime-reports/{id}")
    class UpdateCrimeReport {

        @Test
        void should_return200_whenUpdated() throws Exception {
            when(service.updateCrimeReport(eq(REPORTER_ID), eq(REPORT_ID), any())).thenReturn(sampleCrimeResponse());

            mockMvc.perform(put("/report-manager/crime-reports/{id}", REPORT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateCrimeReportRequest.builder()
                                            .title("Updated").severity(4).date(LocalDate.now()).build())))
                    .andExpect(status().isOk());
        }

        @Test
        void should_return409_whenAlreadyPublic() throws Exception {
            when(service.updateCrimeReport(eq(REPORTER_ID), eq(REPORT_ID), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(put("/report-manager/crime-reports/{id}", REPORT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateCrimeReportRequest.builder()
                                            .title("X").severity(1).date(LocalDate.now()).build())))
                    .andExpect(status().isConflict());
        }
    }

    // ── Guidelines Documents ─────────────────────────────────────────────────

    @Nested @DisplayName("POST /report-manager/guidelines")
    class CreateGuidelinesDocument {

        @Test
        void should_return200_whenValidRequest() throws Exception {
            when(service.createGuidelinesDocument(eq(REPORTER_ID), any())).thenReturn(sampleGuidelineResponse());

            mockMvc.perform(post("/report-manager/guidelines")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    CreateGuidelinesDocumentRequest.builder()
                                            .title("Guide").abstractText("Abstract").build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(DOC_ID.toString()));
        }

        @Test
        void should_return400_whenTitleBlank() throws Exception {
            mockMvc.perform(post("/report-manager/guidelines")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    CreateGuidelinesDocumentRequest.builder()
                                            .title("").abstractText("Abstract").build())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("POST /report-manager/guidelines/{id}/publish")
    class PublishGuidelinesDocument {

        @Test
        void should_return200_whenPublished() throws Exception {
            GuidelinesDocumentResponse pub = sampleGuidelineResponse();
            pub.setPublicFlag(true);
            when(service.publishGuidelinesDocument(REPORTER_ID, DOC_ID)).thenReturn(pub);

            mockMvc.perform(post("/report-manager/guidelines/{id}/publish", DOC_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isPublic").value(true));
        }

        @Test
        void should_return409_whenAlreadyPublic() throws Exception {
            when(service.publishGuidelinesDocument(REPORTER_ID, DOC_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(post("/report-manager/guidelines/{id}/publish", DOC_ID))
                    .andExpect(status().isConflict());
        }
    }

    @Nested @DisplayName("DELETE /report-manager/guidelines/{id}")
    class DeleteGuidelinesDocument {

        @Test
        void should_return204_whenDeleted() throws Exception {
            doNothing().when(service).deleteGuidelinesDocument(REPORTER_ID, DOC_ID);

            mockMvc.perform(delete("/report-manager/guidelines/{id}", DOC_ID))
                    .andExpect(status().isNoContent());
        }
    }

    // ── Missing tests added to match current implementation ──────────────────

    @Nested @DisplayName("PUT /report-manager/missing-person-reports/{id}")
    class UpdateMissingPersonReport {

        @Test
        void should_return200_whenUpdated() throws Exception {
            when(service.updateMissingPersonReport(eq(REPORTER_ID), eq(REPORT_ID), any())).thenReturn(sampleMissingResponse());

            mockMvc.perform(put("/report-manager/missing-person-reports/{id}", REPORT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateMissingPersonReportRequest.builder()
                                            .title("Updated").fullName("Jane").personalId("ID1")
                                            .date(LocalDate.now()).contactPhone("+1234567890").build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(REPORT_ID.toString()));
        }

        @Test
        void should_return409_whenAlreadyPublished() throws Exception {
            when(service.updateMissingPersonReport(eq(REPORTER_ID), eq(REPORT_ID), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(put("/report-manager/missing-person-reports/{id}", REPORT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateMissingPersonReportRequest.builder()
                                            .title("X").fullName("X").personalId("X")
                                            .date(LocalDate.now()).contactPhone("+1234567890").build())))
                    .andExpect(status().isConflict());
        }

        @Test
        void should_return400_whenTitleBlank() throws Exception {
            mockMvc.perform(put("/report-manager/missing-person-reports/{id}", REPORT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateMissingPersonReportRequest.builder()
                                            .title("").fullName("Jane").personalId("ID1")
                                            .date(LocalDate.now()).contactPhone("+1234567890").build())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("GET /report-manager/crime-reports/{id}")
    class GetCrimeReport {

        @Test
        void should_return200_whenFound() throws Exception {
            when(service.getCrimeReport(REPORTER_ID, REPORT_ID)).thenReturn(sampleCrimeResponse());

            mockMvc.perform(get("/report-manager/crime-reports/{id}", REPORT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(REPORT_ID.toString()));
        }

        @Test
        void should_return404_whenNotFound() throws Exception {
            when(service.getCrimeReport(REPORTER_ID, REPORT_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

            mockMvc.perform(get("/report-manager/crime-reports/{id}", REPORT_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("DELETE /report-manager/crime-reports/{id}")
    class DeleteCrimeReport {

        @Test
        void should_return204_whenDeleted() throws Exception {
            doNothing().when(service).deleteCrimeReport(REPORTER_ID, REPORT_ID);

            mockMvc.perform(delete("/report-manager/crime-reports/{id}", REPORT_ID))
                    .andExpect(status().isNoContent());
        }

        @Test
        void should_return404_whenNotFound() throws Exception {
            doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                    .when(service).deleteCrimeReport(REPORTER_ID, REPORT_ID);

            mockMvc.perform(delete("/report-manager/crime-reports/{id}", REPORT_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("GET /report-manager/crime-reports")
    class ListCrimeReports {

        @Test
        void should_return200_withDefaultPagination() throws Exception {
            when(service.listCrimeReports(any(), any(), any(), any(), anyBoolean(), anyInt(), anyInt()))
                    .thenReturn(PageResponse.<CrimeReportResponse>builder()
                            .content(List.of()).page(0).size(10).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/crime-reports"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        void should_capSizeAt100() throws Exception {
            when(service.listCrimeReports(any(), any(), any(), any(), anyBoolean(), anyInt(), eq(100)))
                    .thenReturn(PageResponse.<CrimeReportResponse>builder()
                            .content(List.of()).page(0).size(100).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/crime-reports").param("size", "999"))
                    .andExpect(status().isOk());

            verify(service).listCrimeReports(any(), any(), any(), any(), anyBoolean(), anyInt(), eq(100));
        }
    }

    @Nested @DisplayName("GET /report-manager/crime-reports/nearby")
    class ListCrimeReportsNearby {

        @Test
        void should_return200_withDefaultRadius() throws Exception {
            when(service.listCrimeReportsWithinRadius(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyInt()))
                    .thenReturn(PageResponse.<CrimeReportResponse>builder()
                            .content(List.of()).page(0).size(10).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/crime-reports/nearby")
                            .param("longitude", "106.7")
                            .param("latitude", "10.7"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        void should_return400_whenLongitudeOrLatitudeMissing() throws Exception {
            mockMvc.perform(get("/report-manager/crime-reports/nearby")
                            .param("latitude", "10.7"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("GET /report-manager/guidelines/{id}")
    class GetGuidelinesDocument {

        @Test
        void should_return200_whenFound() throws Exception {
            when(service.getGuidelinesDocument(REPORTER_ID, DOC_ID)).thenReturn(sampleGuidelineResponse());

            mockMvc.perform(get("/report-manager/guidelines/{id}", DOC_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(DOC_ID.toString()));
        }

        @Test
        void should_return404_whenNotFound() throws Exception {
            when(service.getGuidelinesDocument(REPORTER_ID, DOC_ID))
                    .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

            mockMvc.perform(get("/report-manager/guidelines/{id}", DOC_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("PUT /report-manager/guidelines/{id}")
    class UpdateGuidelinesDocument {

        @Test
        void should_return200_whenUpdated() throws Exception {
            when(service.updateGuidelinesDocument(eq(REPORTER_ID), eq(DOC_ID), any())).thenReturn(sampleGuidelineResponse());

            mockMvc.perform(put("/report-manager/guidelines/{id}", DOC_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateGuidelinesDocumentRequest.builder()
                                            .title("Updated").abstractText("New Abstract").build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(DOC_ID.toString()));
        }

        @Test
        void should_return409_whenAlreadyPublic() throws Exception {
            when(service.updateGuidelinesDocument(eq(REPORTER_ID), eq(DOC_ID), any()))
                    .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

            mockMvc.perform(put("/report-manager/guidelines/{id}", DOC_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateGuidelinesDocumentRequest.builder()
                                            .title("X").abstractText("X").build())))
                    .andExpect(status().isConflict());
        }

        @Test
        void should_return400_whenTitleBlank() throws Exception {
            mockMvc.perform(put("/report-manager/guidelines/{id}", DOC_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdateGuidelinesDocumentRequest.builder()
                                            .title("").abstractText("Abstract").build())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("GET /report-manager/guidelines")
    class ListGuidelinesDocuments {

        @Test
        void should_return200_withDefaultPagination() throws Exception {
            when(service.listGuidelinesDocuments(any(), any(), any(), anyInt(), anyInt()))
                    .thenReturn(PageResponse.<GuidelinesDocumentResponse>builder()
                            .content(List.of()).page(0).size(10).totalElements(0).totalPages(0)
                            .first(true).last(true).build());

            mockMvc.perform(get("/report-manager/guidelines"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }
}
