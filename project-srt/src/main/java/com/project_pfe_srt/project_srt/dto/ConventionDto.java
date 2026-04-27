package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.Convention;
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
                .build();
    }
}
