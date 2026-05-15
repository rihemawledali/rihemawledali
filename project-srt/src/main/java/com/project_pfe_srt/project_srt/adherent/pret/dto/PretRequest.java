package com.project_pfe_srt.project_srt.adherent.pret.dto;

import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PretRequest {
    private Double montant;
    private Integer duree;
    private Double taux;
    private String motif;
    /** Optional: id of an Attachment previously uploaded via POST /api/files. */
    private Long attachmentId;
}
