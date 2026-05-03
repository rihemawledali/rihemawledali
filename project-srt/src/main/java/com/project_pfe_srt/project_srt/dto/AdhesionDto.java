package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.Adhesion;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdhesionDto {
    private String id;
    private String adherentId;
    private String adherentNom;
    private String adherentEmail;
    private String adherentTelephone;
    private String adherentMatricule;
    private String adherentStatut;
    private String dateDebut;
    private String dateFin;
    private Double montantCotisation;
    private String statut;
    private String createdAt;

    public static AdhesionDto from(Adhesion a) {
        if (a == null) return null;
        var u = a.getAdherent();
        return AdhesionDto.builder()
                .id(a.getId().toString())
                .adherentId(u.getId().toString())
                .adherentNom((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .adherentEmail(u.getEmail())
                .adherentTelephone(u.getTelephone())
                .adherentMatricule(u.getMatricule())
                .adherentStatut(u.getStatut())
                .dateDebut(a.getDateDebut().toString())
                .dateFin(a.getDateFin().toString())
                .montantCotisation(a.getMontantCotisation())
                .statut(a.getStatut())
                .createdAt(u.getCreatedAt() == null ? null : u.getCreatedAt().toString())
                .build();
    }
}
