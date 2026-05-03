package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.Attachment;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentDto {
    private String id;
    private String fileName;
    private String contentType;
    private Long size;
    private String uploadedAt;

    public static AttachmentDto from(Attachment a) {
        if (a == null) return null;
        return AttachmentDto.builder()
                .id(a.getId().toString())
                .fileName(a.getFileName())
                .contentType(a.getContentType())
                .size(a.getSize())
                .uploadedAt(a.getUploadedAt() == null ? null : a.getUploadedAt().toString())
                .build();
    }
}
