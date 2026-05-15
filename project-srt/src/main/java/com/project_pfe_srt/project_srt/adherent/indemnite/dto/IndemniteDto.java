package com.project_pfe_srt.project_srt.adherent.indemnite.dto;

import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndemniteDto {
    private String id;
    private String adherentId;
    private String adherentNom;
    private String type;
    private Double montant;
    private String statut;
    private String dateDemande;
    private String motif;
    private String documentNom;
    private Long documentSize;
    private String attachmentId;

    public static IndemniteDto from(Indemnite i) {
        if (i == null) return null;
        var u = i.getAdherent();
        var a = i.getAttachment();
        return IndemniteDto.builder()
                .id(i.getId().toString())
                .adherentId(u.getId().toString())
                .adherentNom((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .type(i.getType())
                .montant(i.getMontant())
                .statut(i.getStatut())
                .dateDemande(i.getDateDemande() == null ? null : i.getDateDemande().toString())
                .motif(i.getMotif())
                .documentNom(a == null ? null : a.getFileName())
                .documentSize(a == null ? null : a.getSize())
                .attachmentId(a == null ? null : a.getId().toString())
                .build();
    }
}
