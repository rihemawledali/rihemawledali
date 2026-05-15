package com.project_pfe_srt.project_srt.adherent.convention.dto;

import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionAdherentDto {
    private String id;
    private String fournisseurId;
    private String fournisseurNom;
    private String type;
    private String dateDebut;
    private String dateFin;
    private Double remise;
    private String statut;
    private String description;

    /** disponible | deja_demandee | active | expiree | non_disponible */
    private String adherentStatus;

    /** True when the current adherent has joined the convention. */
    private Boolean joined;

    /** Optional supplier contact info (mirrored). */
    private String fournisseurAdresse;
    private String fournisseurTelephone;
    private String fournisseurEmail;

    // ----- Mode d'avantage -----
    private String typeConvention;
    private String modeAvantage;
    private Double tauxReduction;
    private Double montantReduction;
    private String descriptionAvantage;

    public static ConventionAdherentDto from(Convention c, String adherentStatus) {
        if (c == null) return null;
        var f = c.getFournisseur();
        return ConventionAdherentDto.builder()
                .id(c.getId().toString())
                .fournisseurId(f == null ? null : f.getId().toString())
                .fournisseurNom(f == null ? null : f.getNom())
                .type(c.getType())
                .dateDebut(c.getDateDebut().toString())
                .dateFin(c.getDateFin().toString())
                .remise(c.getRemise())
                .statut(c.getStatut())
                .description(c.getDescription())
                .adherentStatus(adherentStatus)
                .joined("active".equals(adherentStatus))
                .fournisseurAdresse(f == null ? null : f.getAdresse())
                .fournisseurTelephone(f == null ? null : f.getTelephone())
                .fournisseurEmail(f == null ? null : f.getEmail())
                .typeConvention(c.getTypeConvention())
                .modeAvantage(c.getModeAvantage() == null ? null : c.getModeAvantage().name())
                .tauxReduction(c.getTauxReduction())
                .montantReduction(c.getMontantReduction())
                .descriptionAvantage(c.getDescriptionAvantage())
                .build();
    }
}
