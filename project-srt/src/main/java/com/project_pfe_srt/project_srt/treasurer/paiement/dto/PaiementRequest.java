package com.project_pfe_srt.project_srt.treasurer.paiement.dto;

import com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement;

import lombok.*;

/**
 * Generic creation/update payload for {@link com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement}.
 *
 * For workflow-driven creations (paying a facture or indemnité), use the
 * dedicated `/payer-facture/{id}` and `/payer-indemnite/{id}` endpoints
 * which only require {@link #reference}, {@link #montant}, {@link #mode},
 * {@link #description}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementRequest {
    private String reference;
    private String typePaiement;
    private String beneficiaireType;
    private Long beneficiaireId;
    private String beneficiaire;
    private Long factureId;
    private Long indemniteId;
    private Double montant;
    private String mode;
    private String statut;
    private String description;
    private String date; // ISO datetime — optional, defaults to now
    private Long compteBancaireId;
}
