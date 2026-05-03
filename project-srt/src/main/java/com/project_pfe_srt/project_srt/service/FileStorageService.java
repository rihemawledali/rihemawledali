package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.entity.Attachment;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.AttachmentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

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

    /** Saves the file under a unique name and persists an Attachment row. */
    public Attachment save(MultipartFile file, User uploader) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide.");
        }
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String cleanName = original.replaceAll("[\\\\/\\r\\n]", "_");
        String unique = UUID.randomUUID() + "_" + cleanName;
        try {
            Path target = root.resolve(unique).normalize();
            if (!target.startsWith(root)) {
                throw new IllegalArgumentException("Chemin de fichier invalide.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            Attachment a = Attachment.builder()
                    .fileName(cleanName)
                    .storagePath(target.toString())
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .uploadedBy(uploader == null ? null : uploader.getId())
                    .build();
            return attachmentRepository.save(a);
        } catch (IOException e) {
            throw new IllegalStateException("Échec de l'enregistrement du fichier.", e);
        }
    }

    public Attachment require(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pièce jointe introuvable."));
    }

    public Resource loadAsResource(Attachment a) {
        try {
            Path path = Paths.get(a.getStoragePath()).normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalStateException("Fichier introuvable sur le disque.");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Chemin de fichier invalide.", e);
        }
    }
}
