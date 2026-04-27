package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConventionRequest {
    private String fournisseurId;
    private String type;
    private String dateDebut; // yyyy-MM-dd
    private String dateFin;
    private Double remise;
    private String statut;
    private String description;
}
