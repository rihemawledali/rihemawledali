package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "adhesions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Adhesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "montant_cotisation", nullable = false)
    private Double montantCotisation;

    /** active | expiree | suspendue */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "active";
}
