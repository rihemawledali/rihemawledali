package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Paiement (sortie d'argent).
 *
 * `typePaiement` détermine la nature et les effets de bord:
 *   - PAIEMENT_FACTURE_FOURNISSEUR : passe la facture liée à `payee`
 *   - PAIEMENT_INDEMNITE           : passe l'indemnité liée à `payee`
 *   - AUTRE_SORTIE                 : sortie libre
 *
 * Tous les paiements `reussi` génèrent une ligne SORTIE dans
 * `historique_tresorerie` et débitent le premier compte bancaire.
 */
@Entity
@Table(name = "paiements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    /** PAIEMENT_FACTURE_FOURNISSEUR | PAIEMENT_INDEMNITE | AUTRE_SORTIE */
    @Builder.Default
    @Column(name = "type_paiement", nullable = false)
    private String typePaiement = "AUTRE_SORTIE";

    /** FOURNISSEUR | ADHERENT | AUTRE */
    @Builder.Default
    @Column(name = "beneficiaire_type", nullable = false)
    private String beneficiaireType = "AUTRE";

    /** Optional FK target id (fournisseurId or adherentId). */
    @Column(name = "beneficiaire_id")
    private Long beneficiaireId;

    /** Display name of the beneficiary, captured at creation time. */
    @Column(nullable = false)
    private String beneficiaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id")
    private Facture facture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indemnite_id")
    private Indemnite indemnite;

    @Column(nullable = false)
    private Double montant;

    /** virement | cheque | especes | carte */
    @Column(nullable = false)
    private String mode;

    /** reussi | en_attente | echoue | rembourse */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "reussi";

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime date;

    @PrePersist
    protected void onCreate() {
        if (date == null) date = LocalDateTime.now();
    }
}
