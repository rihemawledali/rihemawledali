package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Facture émise par un fournisseur.
 *
 * Workflow:
 *   brouillon → non_payee → payee
 *                        → annulee
 *   (intermédiaires legacy: partielle, en_retard, impayee)
 */
@Entity
@Table(name = "factures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @Column(nullable = false)
    private Double montant;

    /** brouillon | non_payee | impayee | partielle | en_retard | payee | annulee */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "non_payee";

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(length = 1000)
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
