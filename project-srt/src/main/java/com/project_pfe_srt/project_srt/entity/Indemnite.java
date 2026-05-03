package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "indemnites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Indemnite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    /** maladie | naissance | mariage | deces | scolarite */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Double montant;

    /** en_attente | approuvee | rejetee | payee */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "en_attente";

    @Column(name = "date_demande", nullable = false)
    private LocalDate dateDemande;

    @Column(length = 1000)
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;
}
