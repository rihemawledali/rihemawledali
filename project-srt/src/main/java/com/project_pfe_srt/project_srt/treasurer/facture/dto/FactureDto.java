package com.project_pfe_srt.project_srt.treasurer.facture.dto;

import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureDto {
    private String id;
    private String numero;
    private String fournisseurId;
    private String fournisseurNom;
    private Double montant;
    private String statut;
    private String dateEmission;
    private String dateEcheance;
    private String description;
    private String sourceType;
    private Integer mois;
    private Integer annee;
    private String createdAt;

    public static FactureDto from(Facture f) {
        if (f == null) return null;
        var four = f.getFournisseur();
        return FactureDto.builder()
                .id(f.getId().toString())
                .numero(f.getNumero())
                .fournisseurId(four == null ? null : four.getId().toString())
                .fournisseurNom(four == null ? null : four.getNom())
                .montant(f.getMontant())
                .statut(f.getStatut())
                .dateEmission(f.getDateEmission() == null ? null : f.getDateEmission().toString())
                .dateEcheance(f.getDateEcheance() == null ? null : f.getDateEcheance().toString())
                .description(f.getDescription())
                .sourceType(f.getSourceType())
                .mois(f.getMois())
                .annee(f.getAnnee())
                .createdAt(f.getCreatedAt() == null ? null : f.getCreatedAt().toString())
                .build();
    }
}
