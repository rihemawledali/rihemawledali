package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.AttachmentDto;
import com.project_pfe_srt.project_srt.entity.Attachment;
import com.project_pfe_srt.project_srt.service.FileStorageService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final AuthUtils authUtils;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            Attachment a = fileStorageService.save(file, authUtils.currentUser());
            return ResponseEntity.ok(AttachmentDto.from(a));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/meta")
    public ResponseEntity<?> meta(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(AttachmentDto.from(fileStorageService.require(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> download(@PathVariable Long id) {
        try {
            Attachment a = fileStorageService.require(id);
            Resource resource = fileStorageService.loadAsResource(a);
            String contentType = a.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : a.getContentType();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + a.getFileName() + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
