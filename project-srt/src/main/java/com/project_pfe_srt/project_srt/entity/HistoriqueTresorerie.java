package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @PrePersist
    protected void onCreate() {
        if (date == null) date = LocalDateTime.now();
    }
}
