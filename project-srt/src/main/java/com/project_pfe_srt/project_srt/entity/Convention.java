package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "conventions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Convention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    /** Lowercase: sante | restauration | transport | loisir | commerce | education */
    @Column(nullable = false)
    private String type;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    /** Legacy global discount in percent (0-100). Optional now: the chosen
     *  {@link ModeAvantage} drives the actual benefit (`tauxReduction` or
     *  `montantReduction`). Kept for backward compatibility / read-only use. */
    @Column
    private Double remise;

    /** Lowercase: active | expiree | en_negociation | suspendue */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "active";

    @Column(length = 1000)
    private String description;

    // ---------------------------------------------------------------
    // Mode d'avantage (nouveau modele, ajout non-destructif).
    // Le champ legacy {@link #type} (sante/restauration/...) reste la
    // categorie metier de la convention; {@code typeConvention} decrit
    // le format du contrat (ex. partenariat, cadre, offre ponctuelle).
    // ---------------------------------------------------------------

    /** Optional free-text convention kind (e.g. partenariat, cadre, offre). */
    @Column(name = "type_convention", length = 80)
    private String typeConvention;

    /** Mode d'avantage applique (voir {@link ModeAvantage}). */
    @Enumerated(EnumType.STRING)
    @Column(name = "mode_avantage", length = 40)
    private ModeAvantage modeAvantage;

    /** Taux de reduction en % (0-100) — utilise si {@code modeAvantage == REMISE_POURCENTAGE}. */
    @Column(name = "taux_reduction")
    private Double tauxReduction;

    /** Montant de reduction / subvention — utilise si {@code modeAvantage} ∈ {REMISE_MONTANT_FIXE, SUBVENTION_AMICALE}. */
    @Column(name = "montant_reduction")
    private Double montantReduction;

    /** Description libre de l'avantage (contexte, conditions, plafond, etc.). */
    @Column(name = "description_avantage", length = 1000)
    private String descriptionAvantage;
}
