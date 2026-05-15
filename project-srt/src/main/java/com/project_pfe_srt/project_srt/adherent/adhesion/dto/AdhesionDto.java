package com.project_pfe_srt.project_srt.adherent.adhesion.dto;

import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;

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
                .id(a.getId() == null ? null : a.getId().toString())
                .adherentId(u == null || u.getId() == null ? null : u.getId().toString())
                .adherentNom(u == null ? null : ((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom())).trim())
                .adherentEmail(u == null ? null : u.getEmail())
                .adherentTelephone(u == null ? null : u.getTelephone())
                .adherentMatricule(u == null ? null : u.getMatricule())
                .adherentStatut(u == null ? null : u.getStatut())
                .dateDebut(a.getDateDebut() == null ? null : a.getDateDebut().toString())
                .dateFin(a.getDateFin() == null ? null : a.getDateFin().toString())
                .montantCotisation(a.getMontantCotisation())
                .statut(a.getStatut())
                .createdAt(u == null || u.getCreatedAt() == null ? null : u.getCreatedAt().toString())
                .build();
    }
}
