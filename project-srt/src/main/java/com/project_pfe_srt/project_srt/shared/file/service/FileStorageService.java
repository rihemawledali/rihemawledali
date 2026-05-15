package com.project_pfe_srt.project_srt.shared.file.service;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.max-size-bytes:10485760}")
    private long maxSizeBytes;

    @Value("${app.upload.allowed-content-types:application/pdf,image/jpeg,image/png}")
    private String allowedContentTypes;

    private final AttachmentRepository attachmentRepository;

    private Path root;

    @PostConstruct
    public void init() {
        try {
            root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de créer le dossier d'upload : " + uploadDir, e);
        }
    }

    @Transactional
    public Attachment save(MultipartFile file, User uploader) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide.");
        }
        validateFile(file);

        String cleanName = cleanFileName(file.getOriginalFilename());
        String uniqueName = UUID.randomUUID() + "_" + cleanName;

        try {
            Path target = root.resolve(uniqueName).normalize();
            if (!target.startsWith(root)) {
                throw new IllegalArgumentException("Chemin de fichier invalide.");
            }

            Files.copy(file.getInputStream(), target);

            Attachment attachment = Attachment.builder()
                    .fileName(cleanName)
                    .storagePath(target.toString())
                    .contentType(normalizeContentType(file.getContentType()))
                    .size(file.getSize())
                    .uploadedBy(uploader == null ? null : uploader.getId())
                    .build();
            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new IllegalStateException("Échec de l'enregistrement du fichier.", e);
        }
    }

    @Transactional(readOnly = true)
    public StoredFile load(Long attachmentId, User currentUser) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> NotFoundException.of("PiÃ¨ce jointe"));
        ensureCanDownload(attachment, currentUser);

        Path stored = Paths.get(attachment.getStoragePath()).toAbsolutePath().normalize();
        if (!stored.startsWith(root)) {
            throw new IllegalArgumentException("Chemin de fichier invalide.");
        }
        if (!Files.isRegularFile(stored)) {
            throw NotFoundException.of("Fichier");
        }

        try {
            return new StoredFile(attachment, Files.readAllBytes(stored));
        } catch (IOException e) {
            throw new IllegalStateException("Ã‰chec de lecture du fichier.", e);
        }
    }

    public record StoredFile(Attachment attachment, byte[] content) {}

    private void validateFile(MultipartFile file) {
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("Fichier trop volumineux (maximum 10 Mo).");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!allowedContentTypeSet().contains(contentType)) {
            throw new IllegalArgumentException("Type de fichier non autorisÃ©. Formats acceptÃ©s : PDF, JPG, PNG.");
        }
    }

    private Set<String> allowedContentTypeSet() {
        return Arrays.stream(allowedContentTypes.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    private static void ensureCanDownload(Attachment attachment, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentification requise.");
        }
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.TRESORIER) {
            return;
        }
        if (attachment.getUploadedBy() != null && attachment.getUploadedBy().equals(currentUser.getId())) {
            return;
        }
        throw new AccessDeniedException("PiÃ¨ce jointe non autorisÃ©e.");
    }

    private static String cleanFileName(String originalFilename) {
        String original = originalFilename == null || originalFilename.isBlank() ? "file" : originalFilename;
        String normalizedSeparators = original.replace('\\', '/');
        String baseName = normalizedSeparators.substring(normalizedSeparators.lastIndexOf('/') + 1);
        String fileName = baseName
                .replaceAll("[\\r\\n\"]", "_")
                .replaceAll("[^a-zA-Z0-9._ -]", "_")
                .trim();
        return fileName.isBlank() ? "file" : fileName;
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        return contentType;
    }
}
