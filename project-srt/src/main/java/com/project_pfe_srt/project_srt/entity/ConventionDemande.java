package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "convention_demandes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDemande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "convention_id", nullable = false)
    private Convention convention;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    @Column(name = "date_demande", nullable = false)
    private LocalDate dateDemande;

    /** en_attente | validee | refusee | annulee */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "en_attente";

    @Column(name = "date_decision")
    private LocalDate dateDecision;

    @Column(name = "motif_refus", length = 1000)
    private String motifRefus;

    @Column(length = 1000)
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;
}
