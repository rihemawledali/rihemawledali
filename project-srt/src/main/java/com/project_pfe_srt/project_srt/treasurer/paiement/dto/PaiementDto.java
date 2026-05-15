package com.project_pfe_srt.project_srt.treasurer.paiement.dto;

import com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementDto {
    private String id;
    private String reference;
    private String typePaiement;
    private String beneficiaireType;
    private String beneficiaireId;
    private String beneficiaire;
    private String factureId;
    private String factureNumero;
    private String indemniteId;
    private Double montant;
    private String mode;
    private String statut;
    private String description;
    private String date;
    private String compteBancaireId;
    private String compteBancaireBanque;

    public static PaiementDto from(Paiement p) {
        if (p == null) return null;
        var f = p.getFacture();
        var i = p.getIndemnite();
        var cb = p.getCompteBancaire();
        return PaiementDto.builder()
                .id(p.getId().toString())
                .reference(p.getReference())
                .typePaiement(p.getTypePaiement())
                .beneficiaireType(p.getBeneficiaireType())
                .beneficiaireId(p.getBeneficiaireId() == null ? null : p.getBeneficiaireId().toString())
                .beneficiaire(p.getBeneficiaire())
                .factureId(f == null ? null : f.getId().toString())
                .factureNumero(f == null ? null : f.getNumero())
                .indemniteId(i == null ? null : i.getId().toString())
                .montant(p.getMontant())
                .mode(p.getMode())
                .statut(p.getStatut())
                .description(p.getDescription())
                .date(p.getDate() == null ? null : p.getDate().toString())
                .compteBancaireId(cb == null ? null : cb.getId().toString())
                .compteBancaireBanque(cb == null ? null : cb.getBanque())
                .build();
    }
}
