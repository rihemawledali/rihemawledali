package com.project_pfe_srt.project_srt.treasurer.boncommande.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeRequest {
    private String numero;
    private Long fournisseurId;
    /** Kept for legacy/direct-assignment use. New bons omit this. */
    private Long adherentId;
    private String typeBon;          // restaurant | cafeteria
    private Double montant;          // total value (e.g. 1000 DT)
    private Double valeurUnitaire;   // per-ticket face value (e.g. 10 DT)
    private Integer quantiteTotale;  // optional — derived from montant/valeurUnitaire if omitted
    private String statut;
    private String dateEmission;
    private String dateExpiration;
}
