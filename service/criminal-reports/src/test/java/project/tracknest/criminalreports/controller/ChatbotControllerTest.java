package project.tracknest.criminalreports.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostMessageRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostSessionRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.GetSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostMesssgeResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.service.ChatbotService;
import project.tracknest.criminalreports.utils.SecuritySetup;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChatbotController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatbotControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean  private ChatbotService service;

    private static final UUID USER_ID    = SecuritySetup.REPORTER_USER_ID;
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID DOC_ID     = UUID.randomUUID();

    @BeforeEach
    void setupSecurity() {
        SecuritySetup.setUpReporterSecurityContext();
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_startSession_return200() throws Exception {
        when(service.startChatbotSession(eq(USER_ID), any()))
                .thenReturn(PostSessionResponse.builder()
                        .sessionId(SESSION_ID).createdAtMs(System.currentTimeMillis()).build());

        mockMvc.perform(post("/chatbot/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                PostSessionRequest.builder().documentId(DOC_ID).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(SESSION_ID.toString()));
    }

    @Test
    void should_startSession_return404_whenDocumentNotFound() throws Exception {
        when(service.startChatbotSession(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        mockMvc.perform(post("/chatbot/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                PostSessionRequest.builder().documentId(DOC_ID).build())))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_sendMessage_return200() throws Exception {
        when(service.sendMessage(eq(USER_ID), any()))
                .thenReturn(PostMesssgeResponse.builder()
                        .response("Answer.").createdAt(System.currentTimeMillis()).build());

        mockMvc.perform(post("/chatbot/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                PostMessageRequest.builder()
                                        .sessionId(SESSION_ID).message("What happened?").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("Answer."));
    }

    @Test
    void should_sendMessage_return404_whenSessionNotFound() throws Exception {
        when(service.sendMessage(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(post("/chatbot/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                PostMessageRequest.builder()
                                        .sessionId(SESSION_ID).message("Hello?").build())))
                .andExpect(status().isNotFound());
    }

    @Test
    void should_sendMessage_return400_whenMessageTooShort() throws Exception {
        mockMvc.perform(post("/chatbot/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                PostMessageRequest.builder()
                                        .sessionId(SESSION_ID).message("Hi").build())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void should_retrieveSession_return200() throws Exception {
        when(service.retrieveSession(eq(USER_ID), eq(SESSION_ID)))
                .thenReturn(GetSessionResponse.builder()
                        .documentId(DOC_ID).createdAtMs(System.currentTimeMillis())
                        .messageLeft((short) 14).messages(List.of()).build());

        mockMvc.perform(get("/chatbot/session/{id}", SESSION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageLeft").value(14));
    }

    @Test
    void should_retrieveSession_return404_whenNotFound() throws Exception {
        when(service.retrieveSession(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/chatbot/session/{id}", SESSION_ID))
                .andExpect(status().isNotFound());
    }
}
