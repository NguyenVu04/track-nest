package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.criminalreports.domain.reportadmin.ReportAdminService;

import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportAdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportAdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private ReportAdminService service;

    private static final UUID TARGET = UUID.randomUUID();

    @Test
    void should_deleteMissingPersonReport_return204() throws Exception {
        doNothing().when(service).deleteMissingPersonReportAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/missing-person-reports/{id}", TARGET))
                .andExpect(status().isNoContent());

        verify(service).deleteMissingPersonReportAsAdmin(TARGET);
    }

    @Test
    void should_deleteMissingPersonReport_return404_whenNotFound() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(service).deleteMissingPersonReportAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/missing-person-reports/{id}", TARGET))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_deleteCrimeReport_return204() throws Exception {
        doNothing().when(service).deleteCrimeReportAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/crime-reports/{id}", TARGET))
                .andExpect(status().isNoContent());
    }

    @Test
    void should_deleteCrimeReport_return404_whenNotFound() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(service).deleteCrimeReportAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/crime-reports/{id}", TARGET))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_deleteGuidelinesDocument_return204() throws Exception {
        doNothing().when(service).deleteGuidelinesDocumentAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/guidelines/{id}", TARGET))
                .andExpect(status().isNoContent());
    }

    @Test
    void should_deleteGuidelinesDocument_return404_whenNotFound() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(service).deleteGuidelinesDocumentAsAdmin(TARGET);

        mockMvc.perform(delete("/report-admin/guidelines/{id}", TARGET))
                .andExpect(status().isNotFound());
    }
}
