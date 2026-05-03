package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeRequest {
    private String numero;
    private Long fournisseurId;
    private Long adherentId;
    private Double montant;
    private String statut;
    private String dateEmission;
    private String dateExpiration;
}
