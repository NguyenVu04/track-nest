package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.utils.SecuritySetup;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MissingPersonRequestReceiverController.class)
@AutoConfigureMockMvc(addFilters = false)
class MissingPersonRequestReceiverControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private MissingPersonRequestReceiverService service;

    private static final UUID USER_ID     = SecuritySetup.REPORTER_USER_ID;
    private static final UUID REPORTER_ID = UUID.randomUUID();
    private static final UUID REPORT_ID   = UUID.randomUUID();

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
                .content("http://url/index.html").status("PENDING")
                .createdAt(OffsetDateTime.now()).userId(USER_ID).reporterId(REPORTER_ID)
                .publicFlag(false).build();
    }

    @Test
    void should_submitReport_return200_whenValidRequest() throws Exception {
        when(service.submitMissingPersonReport(
                eq(USER_ID), eq(REPORTER_ID),
                eq("Missing"), eq("John"), eq("ID1"),
                isNull(), isNull(), eq("+1234567890"), any(LocalDate.class)))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/missing-person-request-receiver/submit")
                        .param("reporterId", REPORTER_ID.toString())
                        .param("title", "Missing")
                        .param("fullName", "John")
                        .param("personalId", "ID1")
                        .param("contactPhone", "+1234567890")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(REPORT_ID.toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void should_return404_whenReporterNotFound() throws Exception {
        when(service.submitMissingPersonReport(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporter not found"));

        mockMvc.perform(post("/missing-person-request-receiver/submit")
                        .param("reporterId", REPORTER_ID.toString())
                        .param("title", "Missing")
                        .param("fullName", "John")
                        .param("personalId", "ID1")
                        .param("contactPhone", "+1234567890")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_return400_whenRequiredParamMissing() throws Exception {
        // Missing required params: title, fullName, personalId, contactPhone
        mockMvc.perform(post("/missing-person-request-receiver/submit")
                        .param("reporterId", REPORTER_ID.toString())
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isBadRequest());
    }
}
