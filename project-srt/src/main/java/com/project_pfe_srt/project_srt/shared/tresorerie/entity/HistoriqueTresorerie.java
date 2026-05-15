package com.project_pfe_srt.project_srt.shared.tresorerie.entity;

import com.project_pfe_srt.project_srt.adherent.historique.entity.HistoriqueFinanciere;

import jakarta.persistence.*;
import lombok.*;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;

import java.time.LocalDateTime;

/**
 * Historique global de la trésorerie (entrées / sorties), distinct
 * de {@link HistoriqueFinanciere} qui tracke le solde de chaque adhérent.
 *
 * `type`        ∈ entree | sortie
 * `sourceType`  ∈ FACTURE | INDEMNITE | RETENUE | AUTRE
 * `sourceRefId` est l'ID de l'entité d'origine (factureId, indemniteId, …).
 */
@Entity
@Table(name = "historique_tresorerie")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueTresorerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** entree | sortie */
    @Column(nullable = false)
    private String type;

    /** FACTURE | INDEMNITE | RETENUE | AUTRE */
    @Column(name = "source_type")
    private String sourceType;

    @Column(name = "source_ref_id")
    private Long sourceRefId;

    @Column(length = 500)
    private String description;

    /** Signed: positive for entree, negative for sortie. */
    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(length = 100)
    private String reference;

    @Column(name = "mode_paiement")
    private String modePaiement;

    private String statut;

    /** Optional — name of the user who triggered the operation. */
    private String utilisateur;

    /** VERSEMENT_MANUEL | PAIEMENT | … */
    @Column(name = "type_operation")
    private String typeOperation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_bancaire_id")
    private CompteBancaire compteBancaire;

    @PrePersist
    protected void onCreate() {
        if (date == null) date = LocalDateTime.now();
    }
}
