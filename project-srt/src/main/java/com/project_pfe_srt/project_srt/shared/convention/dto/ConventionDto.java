package com.project_pfe_srt.project_srt.shared.convention.dto;

import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDto {
    private String id;
    private String fournisseurId;
    private String fournisseurNom;
    private String type;
    private String dateDebut; // ISO yyyy-MM-dd
    private String dateFin;
    private Double remise;
    private String statut;
    private String description;

    private String typeConvention;
    private String typeAvantage;
    private Double pourcentageAdherent;
    private Double montantAvantage;
    private Integer nombreMoisRetenue;
    private Integer quantiteDisponible;
    private Boolean autoriseAyantsDroit;
    private String documentConventionId;
    private String documentConventionNom;

    public static ConventionDto from(Convention c) {
        return ConventionDto.builder()
                .id(c.getId().toString())
                .fournisseurId(c.getFournisseur().getId().toString())
                .fournisseurNom(c.getFournisseur().getNom())
                .type(c.getType())
                .dateDebut(c.getDateDebut().toString())
                .dateFin(c.getDateFin().toString())
                .remise(c.getRemise())
                .statut(c.getStatut())
                .description(c.getDescription())
                .typeConvention(c.getTypeConvention())
                .typeAvantage(c.getTypeAvantage() == null ? null : c.getTypeAvantage().name())
                .pourcentageAdherent(c.getPourcentageAdherent())
                .montantAvantage(c.getMontantAvantage())
                .nombreMoisRetenue(c.getNombreMoisRetenue())
                .quantiteDisponible(c.getQuantiteDisponible())
                .autoriseAyantsDroit(Boolean.TRUE.equals(c.getAutoriseAyantsDroit()))
                .documentConventionId(c.getDocumentConvention() == null ? null : c.getDocumentConvention().getId().toString())
                .documentConventionNom(c.getDocumentConvention() == null ? null : c.getDocumentConvention().getFileName())
                .build();
    }
}
