package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.utils.SecuritySetup;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MissingPersonRequestReceiverController.class)
@AutoConfigureMockMvc(addFilters = false)
class MissingPersonRequestReceiverControllerTest {

    private static final UUID USER_ID = SecuritySetup.REPORTER_USER_ID;
    private static final UUID REPORTER_ID = UUID.randomUUID();
    private static final UUID REPORT_ID = UUID.randomUUID();
    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private MissingPersonRequestReceiverService service;
    @MockBean
    private ObjectStorage objectStorage;

    @BeforeEach
    void setupSecurity() {
        SecuritySetup.setUpReporterSecurityContext();
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private MissingPersonReportResponse sampleResponse() {
        return MissingPersonReportResponse.builder()
                .id(REPORT_ID).title("Missing").fullName("John").personalId("ID1")
                .date(LocalDate.now()).contactPhone("+1234567890")
                .content("some description").status("PENDING")
                .contactEmail("unknown@gmail.com")
                .createdAt(OffsetDateTime.now()).userId(USER_ID).reporterId(REPORTER_ID)
                .publicFlag(false).build();
    }

    @Test
    void should_submitReport_return200_whenValidRequest() throws Exception {
        when(service.submitMissingPersonReport(
                eq(USER_ID),
                eq("Missing"), eq("John"), eq("ID1"),
                eq("some description"), isNull(), eq("unknown@gmail.com"), eq("+1234567890"), any(LocalDate.class)))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/missing-person-request-receiver/submit")
                        .param("title", "Missing")
                        .param("fullName", "John")
                        .param("personalId", "ID1")
                        .param("contactPhone", "+1234567890")
                        .param("content", "some description")
                        .param("contactEmail", "unknown@gmail.com")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(REPORT_ID.toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void should_return400_whenRequiredParamMissing() throws Exception {
        mockMvc.perform(post("/missing-person-request-receiver/submit")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isBadRequest());
    }
}
