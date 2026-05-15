package com.project_pfe_srt.project_srt.treasurer.boncommande.entity;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "bons_commande")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    /**
     * Kept for backward compatibility with legacy rows that were assigned
     * directly to one adhérent. New rows are stock-level (no adhérent).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adherent_id")
    private User adherent;

    /** restaurant | cafeteria — governs the type of tickets generated. */
    @Builder.Default
    @Column(name = "type_bon", nullable = false)
    private String typeBon = "restaurant";

    /** Total value, e.g. 1000 DT. */
    @Column(nullable = false)
    private Double montant;

    /** Face value of a single ticket, e.g. 10 DT. */
    @Column(name = "valeur_unitaire")
    private Double valeurUnitaire;

    /** Total number of tickets generated from this bon. */
    @Column(name = "quantite_totale")
    private Integer quantiteTotale;

    /** Tickets still unassigned (statut = en_attente). */
    @Column(name = "quantite_restante")
    private Integer quantiteRestante;

    /**
     * Workflow:
     *   brouillon → valide → (epuise | expire)
     * Legacy values still accepted: en_attente, attribue, utilise.
     */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "brouillon";

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_expiration", nullable = false)
    private LocalDate dateExpiration;
}
