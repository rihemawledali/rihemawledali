package com.project_pfe_srt.project_srt.adherent.convention.dto;

import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDemandeDto {
    private String id;
    private String conventionId;
    private String adherentId;
    private String adherentNom;
    private String dateDemande;
    private String statut;
    private String dateDecision;
    private String motifRefus;
    private String commentaire;
    private String documentNom;
    private String attachmentId;

    private ConventionSnapshot conventionSnapshot;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConventionSnapshot {
        private String fournisseurNom;
        private String type;
        private Double remise;
        private String dateDebut;
        private String dateFin;
        private String avantage;
    }

    public static ConventionDemandeDto from(ConventionDemande d) {
        if (d == null) return null;
        var u = d.getAdherent();
        var c = d.getConvention();
        var a = d.getAttachment();
        ConventionSnapshot snap = null;
        if (c != null) {
            Convention conv = c;
            snap = ConventionSnapshot.builder()
                    .fournisseurNom(conv.getFournisseur() == null ? null : conv.getFournisseur().getNom())
                    .type(conv.getType())
                    .remise(conv.getRemise())
                    .dateDebut(conv.getDateDebut().toString())
                    .dateFin(conv.getDateFin().toString())
                    .avantage(null)
                    .build();
        }
        return ConventionDemandeDto.builder()
                .id(d.getId().toString())
                .conventionId(c == null ? null : c.getId().toString())
                .adherentId(u.getId().toString())
                .adherentNom((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .dateDemande(d.getDateDemande().toString())
                .statut(d.getStatut())
                .dateDecision(d.getDateDecision() == null ? null : d.getDateDecision().toString())
                .motifRefus(d.getMotifRefus())
                .commentaire(d.getCommentaire())
                .documentNom(a == null ? null : a.getFileName())
                .attachmentId(a == null ? null : a.getId().toString())
                .conventionSnapshot(snap)
                .build();
    }
}
