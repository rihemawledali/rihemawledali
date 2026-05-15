package com.project_pfe_srt.project_srt.adherent.pret.dto;

import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

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
    private List<Remboursement> remboursements;

    public static PretDto from(PretSocial p) {
        return from(p, List.of());
    }

    public static PretDto from(PretSocial p, List<RetenueLigne> remboursements) {
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
                .remboursements(remboursements == null
                        ? List.of()
                        : remboursements.stream().map(Remboursement::from).toList())
                .build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Remboursement {
        private String id;
        private String retenueId;
        private Integer mois;
        private Integer annee;
        private String dateRetenue;
        private Double montant;
        private String statut;
        private String libelle;

        public static Remboursement from(RetenueLigne ligne) {
            var retenue = ligne.getRetenue();
            Integer mois = retenue == null ? null : retenue.getMois();
            Integer annee = retenue == null ? null : retenue.getAnnee();
            return Remboursement.builder()
                    .id(ligne.getId() == null ? null : ligne.getId().toString())
                    .retenueId(retenue == null || retenue.getId() == null ? null : retenue.getId().toString())
                    .mois(mois)
                    .annee(annee)
                    .dateRetenue(mois == null || annee == null ? null : LocalDate.of(annee, mois, 1).toString())
                    .montant(ligne.getMontant())
                    .statut(ligne.getStatut())
                    .libelle(ligne.getLibelle())
                    .build();
        }
    }
}
