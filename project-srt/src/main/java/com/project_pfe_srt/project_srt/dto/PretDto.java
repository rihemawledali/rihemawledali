package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.PretSocial;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PretDto {
    private String id;
    private String adherentId;
    private String adherentNom;
    private Double montant;
    private Integer duree;
    private Double taux;
    private String statut;
    private String dateDemande;
    private String dateAccord;
    private String motif;
    private String documentNom;
    private Long documentSize;
    private String attachmentId;

    public static PretDto from(PretSocial p) {
        if (p == null) return null;
        var u = p.getAdherent();
        var a = p.getAttachment();
        return PretDto.builder()
                .id(p.getId().toString())
                .adherentId(u.getId().toString())
                .adherentNom((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .montant(p.getMontant())
                .duree(p.getDuree())
                .taux(p.getTaux())
                .statut(p.getStatut())
                .dateDemande(p.getDateDemande() == null ? null : p.getDateDemande().toString())
                .dateAccord(p.getDateAccord() == null ? null : p.getDateAccord().toString())
                .motif(p.getMotif())
                .documentNom(a == null ? null : a.getFileName())
                .documentSize(a == null ? null : a.getSize())
                .attachmentId(a == null ? null : a.getId().toString())
                .build();
    }
}
