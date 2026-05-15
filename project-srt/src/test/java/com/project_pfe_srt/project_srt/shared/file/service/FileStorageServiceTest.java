package com.project_pfe_srt.project_srt.shared.file.service;

import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @TempDir
    private Path tempDir;

    @Mock
    private AttachmentRepository attachmentRepository;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(attachmentRepository);
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "maxSizeBytes", 10L);
        ReflectionTestUtils.setField(service, "allowedContentTypes", "application/pdf,image/jpeg,image/png");
        service.init();
    }

    @Test
    void saveRejectsUnsupportedContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "hello".getBytes());

        assertThatThrownBy(() -> service.save(file, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Type de fichier non autoris");
        verifyNoInteractions(attachmentRepository);
    }

    @Test
    void saveRejectsFileLargerThanConfiguredLimit() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "proof.pdf", "application/pdf", "01234567890".getBytes());

        assertThatThrownBy(() -> service.save(file, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Fichier trop volumineux (maximum 10 Mo).");
        verifyNoInteractions(attachmentRepository);
    }
}
