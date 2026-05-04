package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.BonCommande;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeDto {
    private String id;
    private String numero;
    private String fournisseurId;
    private String fournisseurNom;
    private String adherentId;
    private String adherentNom;
    private String typeBon;
    private Double montant;
    private Double valeurUnitaire;
    private Integer quantiteTotale;
    private Integer quantiteRestante;
    private Integer quantiteAttribuee;
    private String statut;
    private String dateEmission;
    private String dateExpiration;

    public static BonCommandeDto from(BonCommande b) {
        if (b == null) return null;
        var f = b.getFournisseur();
        var a = b.getAdherent();
        int total = b.getQuantiteTotale() == null ? 0 : b.getQuantiteTotale();
        int restant = b.getQuantiteRestante() == null ? 0 : b.getQuantiteRestante();
        return BonCommandeDto.builder()
                .id(b.getId().toString())
                .numero(b.getNumero())
                .fournisseurId(f == null ? null : f.getId().toString())
                .fournisseurNom(f == null ? null : f.getNom())
                .adherentId(a == null ? null : a.getId().toString())
                .adherentNom(a == null ? null : ((a.getPrenom() == null ? "" : a.getPrenom() + " ") + (a.getNom() == null ? "" : a.getNom())))
                .typeBon(b.getTypeBon())
                .montant(b.getMontant())
                .valeurUnitaire(b.getValeurUnitaire())
                .quantiteTotale(b.getQuantiteTotale())
                .quantiteRestante(b.getQuantiteRestante())
                .quantiteAttribuee(Math.max(0, total - restant))
                .statut(b.getStatut())
                .dateEmission(b.getDateEmission() == null ? null : b.getDateEmission().toString())
                .dateExpiration(b.getDateExpiration() == null ? null : b.getDateExpiration().toString())
                .build();
    }
}
