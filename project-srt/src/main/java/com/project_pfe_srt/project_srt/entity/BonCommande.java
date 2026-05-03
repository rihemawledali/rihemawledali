package com.project_pfe_srt.project_srt.entity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adherent_id")
    private User adherent;

    @Column(nullable = false)
    private Double montant;

    /** en_attente | attribue | utilise | expire */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "en_attente";

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_expiration", nullable = false)
    private LocalDate dateExpiration;
}
