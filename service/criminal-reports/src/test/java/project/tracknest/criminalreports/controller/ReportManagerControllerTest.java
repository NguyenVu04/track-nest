package project.tracknest.criminalreports.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.criminalreports.domain.reportmanager.dto.CreateCrimeReportRequest;
import project.tracknest.criminalreports.domain.reportmanager.dto.CreateGuidelinesDocumentRequest;
import project.tracknest.criminalreports.domain.reportmanager.dto.CreateMissingPersonReportRequest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReportManagerControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String BASE_URL = "/report-manager";
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String TEST_REPORTER_ID = "8c52c01e-42a7-45cc-9254-db8a7601c764";

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Nested
    @DisplayName("Missing Person Reports - Create")
    class CreateMissingPersonReport {
        @Test
        @DisplayName("Should create missing person report successfully")
        void testCreateMissingPersonReport_success() throws Exception {
            CreateMissingPersonReportRequest request = CreateMissingPersonReportRequest.builder()
                    .title("Missing Person Alert")
                    .fullName("John Doe")
                    .personalId("123456789")
                    .photo("https://example.com/photo.jpg")
                    .date(LocalDate.now())
                    .content("Missing since yesterday")
                    .contactEmail("contact@example.com")
                    .contactPhone("+1234567890")
                    .build();

            mockMvc.perform(post(BASE_URL + "/missing-person-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title").value("Missing Person Alert"))
                    .andExpect(jsonPath("$.fullName").value("John Doe"))
                    .andExpect(jsonPath("$.personalId").value("123456789"))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        @DisplayName("Should return 400 for invalid missing person report request")
        void testCreateMissingPersonReport_invalidRequest() throws Exception {
            CreateMissingPersonReportRequest request = CreateMissingPersonReportRequest.builder()
                    .title("")
                    .fullName("")
                    .personalId("")
                    .build();

            mockMvc.perform(post(BASE_URL + "/missing-person-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Missing Person Reports - Get")
    class GetMissingPersonReport {
        @Test
        @DisplayName("Should get missing person report by id")
        void testGetMissingPersonReport_success() throws Exception {
            CreateMissingPersonReportRequest createRequest = CreateMissingPersonReportRequest.builder()
                    .title("Missing Person Alert")
                    .fullName("Jane Doe")
                    .personalId("987654321")
                    .date(LocalDate.now())
                    .content("Missing person report")
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/missing-person-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(get(BASE_URL + "/missing-person-reports/" + reportId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(reportId))
                    .andExpect(jsonPath("$.title").value("Missing Person Alert"))
                    .andExpect(jsonPath("$.fullName").value("Jane Doe"));
        }
    }

    @Nested
    @DisplayName("Missing Person Reports - List")
    class ListMissingPersonReports {
        @Test
        @DisplayName("Should list missing person reports")
        void testListMissingPersonReports_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/missing-person-reports")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(10));
        }

        @Test
        @DisplayName("Should list public missing person reports")
        void testListPublicMissingPersonReports_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/missing-person-reports")
                            .param("isPublic", "true")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("Missing Person Reports - Publish")
    class PublishMissingPersonReport {
        @Test
        @DisplayName("Should publish missing person report")
        void testPublishMissingPersonReport_success() throws Exception {
            CreateMissingPersonReportRequest createRequest = CreateMissingPersonReportRequest.builder()
                    .title("Urgent Missing Person")
                    .fullName("Alice Smith")
                    .personalId("111222333")
                    .date(LocalDate.now())
                    .content("Please help find this person")
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/missing-person-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(post(BASE_URL + "/missing-person-reports/" + reportId + "/publish")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(reportId))
                    .andExpect(jsonPath("$.isPublic").value(true));
        }
    }

    @Nested
    @DisplayName("Missing Person Reports - Delete")
    class DeleteMissingPersonReport {
        @Test
        @DisplayName("Should delete missing person report")
        void testDeleteMissingPersonReport_success() throws Exception {
            CreateMissingPersonReportRequest createRequest = CreateMissingPersonReportRequest.builder()
                    .title("Test Delete")
                    .fullName("Test Person")
                    .personalId("444555666")
                    .date(LocalDate.now())
                    .content("Test content")
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/missing-person-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(delete(BASE_URL + "/missing-person-reports/" + reportId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("Crime Reports - Create")
    class CreateCrimeReport {
        @Test
        @DisplayName("Should create crime report successfully")
        void testCreateCrimeReport_success() throws Exception {
            CreateCrimeReportRequest request = CreateCrimeReportRequest.builder()
                    .title("Burglary Report")
                    .content("Home burglary incident")
                    .severity(3)
                    .date(LocalDate.now())
                    .longitude(106.7018)
                    .latitude(10.7759)
                    .numberOfVictims(1)
                    .numberOfOffenders(2)
                    .arrested(false)
                    .build();

            mockMvc.perform(post(BASE_URL + "/crime-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title").value("Burglary Report"))
                    .andExpect(jsonPath("$.severity").value(3))
                    .andExpect(jsonPath("$.isPublic").value(false));
        }
    }

    @Nested
    @DisplayName("Crime Reports - Get")
    class GetCrimeReport {
        @Test
        @DisplayName("Should get crime report by id")
        void testGetCrimeReport_success() throws Exception {
            CreateCrimeReportRequest createRequest = CreateCrimeReportRequest.builder()
                    .title("Theft Report")
                    .content("Vehicle theft")
                    .severity(4)
                    .date(LocalDate.now())
                    .longitude(106.7018)
                    .latitude(10.7759)
                    .numberOfVictims(1)
                    .numberOfOffenders(1)
                    .arrested(false)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/crime-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(get(BASE_URL + "/crime-reports/" + reportId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(reportId))
                    .andExpect(jsonPath("$.title").value("Theft Report"));
        }
    }

    @Nested
    @DisplayName("Crime Reports - List")
    class ListCrimeReports {
        @Test
        @DisplayName("Should list crime reports")
        void testListCrimeReports_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/crime-reports")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.page").value(0));
        }

        @Test
        @DisplayName("Should list crime reports by minimum severity")
        void testListCrimeReports_bySeverity() throws Exception {
            mockMvc.perform(get(BASE_URL + "/crime-reports")
                            .param("minSeverity", "3")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        @DisplayName("Should list crime reports nearby")
        void testListCrimeReportsNearby_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/crime-reports/nearby")
                            .param("longitude", "106.7018")
                            .param("latitude", "10.7759")
                            .param("radius", "5000")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("Crime Reports - Publish")
    class PublishCrimeReport {
        @Test
        @DisplayName("Should publish crime report")
        void testPublishCrimeReport_success() throws Exception {
            CreateCrimeReportRequest createRequest = CreateCrimeReportRequest.builder()
                    .title("Public Crime")
                    .content("Crime to be published")
                    .severity(2)
                    .date(LocalDate.now())
                    .longitude(106.7018)
                    .latitude(10.7759)
                    .numberOfVictims(0)
                    .numberOfOffenders(1)
                    .arrested(true)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/crime-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(post(BASE_URL + "/crime-reports/" + reportId + "/publish")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(reportId))
                    .andExpect(jsonPath("$.isPublic").value(true));
        }
    }

    @Nested
    @DisplayName("Crime Reports - Delete")
    class DeleteCrimeReport {
        @Test
        @DisplayName("Should delete crime report")
        void testDeleteCrimeReport_success() throws Exception {
            CreateCrimeReportRequest createRequest = CreateCrimeReportRequest.builder()
                    .title("Test Crime Delete")
                    .content("Test content")
                    .severity(1)
                    .date(LocalDate.now())
                    .longitude(106.7018)
                    .latitude(10.7759)
                    .numberOfVictims(0)
                    .numberOfOffenders(0)
                    .arrested(false)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/crime-reports")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String reportId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(delete(BASE_URL + "/crime-reports/" + reportId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("Guidelines Documents - Create")
    class CreateGuidelinesDocument {
        @Test
        @DisplayName("Should create guidelines document successfully")
        void testCreateGuidelinesDocument_success() throws Exception {
            CreateGuidelinesDocumentRequest request = CreateGuidelinesDocumentRequest.builder()
                    .title("Safety Guidelines")
                    .abstractText("General safety tips")
                    .content("Detailed safety guidelines content")
                    .isPublic(true)
                    .build();

            mockMvc.perform(post(BASE_URL + "/guidelines")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title").value("Safety Guidelines"))
                    .andExpect(jsonPath("$.abstractText").value("General safety tips"))
                    .andExpect(jsonPath("$.isPublic").value(true));
        }
    }

    @Nested
    @DisplayName("Guidelines Documents - Get")
    class GetGuidelinesDocument {
        @Test
        @DisplayName("Should get guidelines document by id")
        void testGetGuidelinesDocument_success() throws Exception {
            CreateGuidelinesDocumentRequest createRequest = CreateGuidelinesDocumentRequest.builder()
                    .title("Emergency Procedures")
                    .abstractText("Emergency procedures overview")
                    .content("Detailed emergency procedures")
                    .isPublic(false)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/guidelines")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String documentId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(get(BASE_URL + "/guidelines/" + documentId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(documentId))
                    .andExpect(jsonPath("$.title").value("Emergency Procedures"));
        }
    }

    @Nested
    @DisplayName("Guidelines Documents - List")
    class ListGuidelinesDocuments {
        @Test
        @DisplayName("Should list guidelines documents")
        void testListGuidelinesDocuments_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/guidelines")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.page").value(0));
        }

        @Test
        @DisplayName("Should list public guidelines documents")
        void testListPublicGuidelinesDocuments_success() throws Exception {
            mockMvc.perform(get(BASE_URL + "/guidelines")
                            .param("isPublic", "true")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("Guidelines Documents - Publish")
    class PublishGuidelinesDocument {
        @Test
        @DisplayName("Should publish guidelines document")
        void testPublishGuidelinesDocument_success() throws Exception {
            CreateGuidelinesDocumentRequest createRequest = CreateGuidelinesDocumentRequest.builder()
                    .title("Public Guidelines")
                    .abstractText("To be published")
                    .content("Content to be made public")
                    .isPublic(false)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/guidelines")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String documentId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(post(BASE_URL + "/guidelines/" + documentId + "/publish")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(documentId))
                    .andExpect(jsonPath("$.isPublic").value(true));
        }
    }

    @Nested
    @DisplayName("Guidelines Documents - Delete")
    class DeleteGuidelinesDocument {
        @Test
        @DisplayName("Should delete guidelines document")
        void testDeleteGuidelinesDocument_success() throws Exception {
            CreateGuidelinesDocumentRequest createRequest = CreateGuidelinesDocumentRequest.builder()
                    .title("Test Guidelines Delete")
                    .abstractText("Test")
                    .content("Test content")
                    .isPublic(false)
                    .build();

            String response = mockMvc.perform(post(BASE_URL + "/guidelines")
                            .header(USER_ID_HEADER, TEST_REPORTER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String documentId = mapper.readTree(response).get("id").asText();

            mockMvc.perform(delete(BASE_URL + "/guidelines/" + documentId)
                            .header(USER_ID_HEADER, TEST_REPORTER_ID))
                    .andExpect(status().isNoContent());
        }
    }
}
