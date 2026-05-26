package com.project_pfe_srt.project_srt.shared.convention.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionFactureGenerationRequest {
    private Long fournisseurId;
    private Integer mois;
    private Integer annee;
    private List<Long> demandeIds;
}
