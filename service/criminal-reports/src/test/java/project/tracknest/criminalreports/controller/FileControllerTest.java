package project.tracknest.criminalreports.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;

import java.io.ByteArrayInputStream;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FileController.class)
@AutoConfigureMockMvc(addFilters = false)
class FileControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private ObjectStorage objectStorage;

    private static final UUID DOC_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    // ── POST /file/upload ─────────────────────────────────────────────────────

    @Test
    void should_uploadFile_return200_whenValidImageType() throws Exception {
        doNothing().when(objectStorage).uploadFile(any(), any(), any(), any());

        mockMvc.perform(multipart("/file/upload")
                        .file(new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1, 2, 3})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentType").value("image/png"));
    }

    @Test
    void should_uploadFile_return200_whenPdfType() throws Exception {
        doNothing().when(objectStorage).uploadFile(any(), any(), any(), any());

        mockMvc.perform(multipart("/file/upload")
                        .file(new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1})))
                .andExpect(status().isOk());
    }

    @Test
    void should_uploadFile_return400_whenHtmlContentType() throws Exception {
        mockMvc.perform(multipart("/file/upload")
                        .file(new MockMultipartFile("file", "page.html", "text/html", "<html/>".getBytes())))
                .andExpect(status().isBadRequest());

        verify(objectStorage, never()).uploadFile(any(), any(), any(), any());
    }

    @Test
    void should_uploadFile_return400_whenJsContentType() throws Exception {
        mockMvc.perform(multipart("/file/upload")
                        .file(new MockMultipartFile("file", "script.js", "application/javascript", "alert(1)".getBytes())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void should_uploadFile_return400_whenNullContentType() throws Exception {
        mockMvc.perform(multipart("/file/upload")
                        .file(new MockMultipartFile("file", "data.bin", (String) null, new byte[]{0})))
                .andExpect(status().isBadRequest());
    }

    // ── POST /file/document/{documentId} ─────────────────────────────────────

    @Test
    void should_uploadDocumentHtml_asIndexHtml() throws Exception {
        doNothing().when(objectStorage).uploadFile(any(), eq(DOC_ID + "/index.html"), any(), any());

        mockMvc.perform(multipart("/file/document/{id}", DOC_ID)
                        .file(new MockMultipartFile("file", "content.html", "text/html", "<html/>".getBytes())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filename").value(DOC_ID + "/index.html"));
    }

    @Test
    void should_uploadDocumentImage_withBasenameOnly() throws Exception {
        doNothing().when(objectStorage).uploadFile(any(), eq(DOC_ID + "/photo.png"), any(), any());

        mockMvc.perform(multipart("/file/document/{id}", DOC_ID)
                        .file(new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filename").value(DOC_ID + "/photo.png"));
    }

    @Test
    void should_uploadDocument_sanitiseTraversalFilename_andUploadAsBasename() throws Exception {
        // ../../etc/passwd → basename "passwd"; uploaded safely under {docId}/passwd
        doNothing().when(objectStorage).uploadFile(any(), eq(DOC_ID + "/passwd"), any(), any());

        mockMvc.perform(multipart("/file/document/{id}", DOC_ID)
                        .file(new MockMultipartFile("file", "../../etc/passwd", "image/png", new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filename").value(DOC_ID + "/passwd"));
    }

    // ── DELETE /file/document/{documentId} ───────────────────────────────────

    @Test
    void should_deleteDocumentFolder_return204() throws Exception {
        doNothing().when(objectStorage).deleteFolder(any(), eq(DOC_ID + "/"));

        mockMvc.perform(delete("/file/document/{id}", DOC_ID))
                .andExpect(status().isNoContent());

        verify(objectStorage).deleteFolder(any(), eq(DOC_ID + "/"));
    }

    // ── GET /file/** ──────────────────────────────────────────────────────────

    @Test
    void should_serveFile_return200_withPngContentType() throws Exception {
        when(objectStorage.downloadFile(any(), eq(DOC_ID + "/photo.png")))
                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

        mockMvc.perform(get("/file/{docId}/photo.png", DOC_ID))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("Cache-Control", "public, max-age=86400"));
    }

    @Test
    void should_serveIndexHtml_withHtmlContentType() throws Exception {
        when(objectStorage.downloadFile(any(), eq(DOC_ID + "/index.html")))
                .thenReturn(new ByteArrayInputStream("<html/>".getBytes()));

        mockMvc.perform(get("/file/{docId}/index.html", DOC_ID))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/html"));
    }

    @Test
    void should_serveFile_return404_whenNotFoundInStorage() throws Exception {
        when(objectStorage.downloadFile(any(), any()))
                .thenThrow(new RuntimeException("Not found"));

        mockMvc.perform(get("/file/{docId}/missing.png", DOC_ID))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /file/** ───────────────────────────────────────────────────────

    @Test
    void should_deleteFile_return204() throws Exception {
        doNothing().when(objectStorage).deleteFile(any(), eq(DOC_ID + "/photo.png"));

        mockMvc.perform(delete("/file/{docId}/photo.png", DOC_ID))
                .andExpect(status().isNoContent());

        verify(objectStorage).deleteFile(any(), eq(DOC_ID + "/photo.png"));
    }

    @Test
    void should_deleteFile_return500_whenStorageThrows() throws Exception {
        doThrow(new RuntimeException("Storage error"))
                .when(objectStorage).deleteFile(any(), any());

        mockMvc.perform(delete("/file/{docId}/photo.png", DOC_ID))
                .andExpect(status().isInternalServerError());
    }
}
