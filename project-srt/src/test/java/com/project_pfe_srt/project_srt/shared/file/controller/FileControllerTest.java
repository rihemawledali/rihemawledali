package com.project_pfe_srt.project_srt.shared.file.controller;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.exception.GlobalExceptionHandler;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.shared.file.service.FileStorageService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @TempDir
    private Path tempDir;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private AuthUtils authUtils;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        FileStorageService storageService = new FileStorageService(attachmentRepository);
        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(storageService, "maxSizeBytes", 10485760L);
        ReflectionTestUtils.setField(storageService, "allowedContentTypes", "application/pdf,image/jpeg,image/png");
        storageService.init();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new FileController(storageService, authUtils))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void downloadAllowsOwner() throws Exception {
        Attachment attachment = attachment(1L);
        when(attachmentRepository.findById(10L)).thenReturn(Optional.of(attachment));
        when(authUtils.currentUser()).thenReturn(user(1L, Role.ADHERENT));

        mockMvc.perform(get("/api/files/10"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("doc.pdf")))
                .andExpect(content().bytes("content".getBytes()));
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"ADMIN", "TRESORIER"})
    void downloadAllowsAdminAndTreasurer(Role role) throws Exception {
        Attachment attachment = attachment(1L);
        when(attachmentRepository.findById(10L)).thenReturn(Optional.of(attachment));
        when(authUtils.currentUser()).thenReturn(user(2L, role));

        mockMvc.perform(get("/api/files/10"))
                .andExpect(status().isOk())
                .andExpect(content().bytes("content".getBytes()));
    }

    @Test
    void downloadRejectsAnotherAdherent() throws Exception {
        Attachment attachment = attachment(1L);
        when(attachmentRepository.findById(10L)).thenReturn(Optional.of(attachment));
        when(authUtils.currentUser()).thenReturn(user(2L, Role.ADHERENT));

        mockMvc.perform(get("/api/files/10"))
                .andExpect(status().isForbidden());
    }

    private Attachment attachment(Long uploadedBy) throws Exception {
        Path file = tempDir.resolve("doc.pdf");
        Files.writeString(file, "content");
        return Attachment.builder()
                .id(10L)
                .fileName("doc.pdf")
                .storagePath(file.toString())
                .contentType("application/pdf")
                .size(7L)
                .uploadedBy(uploadedBy)
                .build();
    }

    private static User user(Long id, Role role) {
        return User.builder()
                .id(id)
                .nom("User")
                .prenom("Test")
                .email("user" + id + "@srt.test")
                .role(role)
                .statut("ACTIF")
                .build();
    }
}
