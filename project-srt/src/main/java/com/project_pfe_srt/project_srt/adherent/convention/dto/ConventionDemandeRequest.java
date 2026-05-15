package com.project_pfe_srt.project_srt.adherent.convention.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDemandeRequest {
    private String conventionId;
    private String commentaire;
    private Long attachmentId;
}
