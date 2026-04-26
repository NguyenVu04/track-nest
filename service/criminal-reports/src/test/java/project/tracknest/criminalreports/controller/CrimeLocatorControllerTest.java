package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.crimelocator.CrimeLocatorService;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CrimeLocatorController.class)
@AutoConfigureMockMvc(addFilters = false)
class CrimeLocatorControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private CrimeLocatorService service;

    private static final UUID REPORTER_ID = UUID.randomUUID();

    private PageResponse<CrimeReportResponse> emptyPage() {
        return PageResponse.<CrimeReportResponse>builder()
                .content(List.of()).page(0).size(20).totalElements(0).totalPages(0)
                .first(true).last(true).build();
    }

    private PageResponse<CrimeReportResponse> oneResultPage() {
        return PageResponse.<CrimeReportResponse>builder()
                .content(List.of(CrimeReportResponse.builder()
                        .id(UUID.randomUUID()).title("Crime").content("url").severity(4)
                        .date(LocalDate.now()).longitude(106.7).latitude(10.7)
                        .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now())
                        .reporterId(REPORTER_ID).publicFlag(true).build()))
                .page(0).size(20).totalElements(1).totalPages(1)
                .first(true).last(true).build();
    }

    @Test
    void should_returnHeatmap_withDefaultRadius() throws Exception {
        when(service.viewCrimeHeatmap(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyInt()))
                .thenReturn(oneResultPage());

        mockMvc.perform(get("/crime-locator/heatmap")
                        .param("longitude", "106.7")
                        .param("latitude", "10.7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void should_returnEmptyPage_whenNoReportsInRadius() throws Exception {
        when(service.viewCrimeHeatmap(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyInt()))
                .thenReturn(emptyPage());

        mockMvc.perform(get("/crime-locator/heatmap")
                        .param("longitude", "0.0")
                        .param("latitude", "0.0")
                        .param("radius", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void should_capSizeAt100() throws Exception {
        when(service.viewCrimeHeatmap(anyDouble(), anyDouble(), anyDouble(), anyInt(), eq(100)))
                .thenReturn(emptyPage());

        mockMvc.perform(get("/crime-locator/heatmap")
                        .param("longitude", "106.7")
                        .param("latitude", "10.7")
                        .param("size", "9999"))
                .andExpect(status().isOk());

        verify(service).viewCrimeHeatmap(anyDouble(), anyDouble(), anyDouble(), anyInt(), eq(100));
    }

    @Test
    void should_return400_whenLongitudeOrLatitudeMissing() throws Exception {
        mockMvc.perform(get("/crime-locator/heatmap")
                        .param("latitude", "10.7"))
                .andExpect(status().isBadRequest());
    }
}
