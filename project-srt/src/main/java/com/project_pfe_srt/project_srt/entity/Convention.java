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

    /** Percentage 0-100 */
    @Column(nullable = false)
    private Double remise;

    /** Lowercase: active | expiree | en_negociation | suspendue */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "active";

    @Column(length = 1000)
    private String description;
}
