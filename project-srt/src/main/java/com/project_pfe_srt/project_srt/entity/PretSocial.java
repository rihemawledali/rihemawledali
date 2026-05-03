package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "prets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PretSocial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private Integer duree; // months

    @Column(nullable = false)
    private Double taux; // %

    /** en_cours | rembourse | en_retard | en_attente | rejete */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "en_attente";

    @Column(name = "date_demande", nullable = false)
    private LocalDate dateDemande;

    @Column(name = "date_accord")
    private LocalDate dateAccord;

    @Column(length = 1000)
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;
}
