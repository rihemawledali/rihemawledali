package com.project_pfe_srt.project_srt.dto;

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
