package com.project_pfe_srt.project_srt.treasurer.retenue.dto;

import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueMensuelle;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueMensuelleDto {

    private String id;
    private String adherentId;
    private String adherentNom;
    private Integer mois;
    private Integer annee;
    private Double totalRetenu;
    private String statut;
    private String dateExport;
    private List<Ligne> lignes;
    private String createdAt;
    private String updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Ligne {
        private String id;
        private String type;        // COTISATION | PRET | CONVENTION
        private Double montant;
        private String libelle;
        private String sourceRefId;
        private String statut;

        public static Ligne from(RetenueLigne l) {
            return Ligne.builder()
                    .id(l.getId().toString())
                    .type(l.getType())
                    .montant(l.getMontant())
                    .libelle(l.getLibelle())
                    .sourceRefId(l.getSourceRefId() == null ? null : l.getSourceRefId().toString())
                    .statut(l.getStatut())
                    .build();
        }
    }

    public static RetenueMensuelleDto from(RetenueMensuelle r, List<RetenueLigne> lignes) {
        if (r == null) return null;
        var u = r.getAdherent();
        return RetenueMensuelleDto.builder()
                .id(r.getId().toString())
                .adherentId(u == null ? null : u.getId().toString())
                .adherentNom(u == null ? null : ((u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom())))
                .mois(r.getMois())
                .annee(r.getAnnee())
                .totalRetenu(r.getTotalRetenu())
                .statut(r.getStatut())
                .dateExport(r.getDateExport() == null ? null : r.getDateExport().toString())
                .lignes(lignes == null ? List.of() : lignes.stream().map(Ligne::from).toList())
                .createdAt(r.getCreatedAt() == null ? null : r.getCreatedAt().toString())
                .updatedAt(r.getUpdatedAt() == null ? null : r.getUpdatedAt().toString())
                .build();
    }
}
