package com.project_pfe_srt.project_srt.treasurer.facture.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureRequest {
    private String numero;
    private Long fournisseurId;
    private Double montant;
    private String statut;
    private String dateEmission;   // ISO yyyy-MM-dd
    private String dateEcheance;   // ISO yyyy-MM-dd
    private String description;
    private String sourceType;
    private Integer mois;
    private Integer annee;
}
