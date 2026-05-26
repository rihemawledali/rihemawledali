package com.project_pfe_srt.project_srt.shared.tresorerie.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_tresorerie")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueTresorerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(name = "source_type")
    private String sourceType;

    @Column(name = "source_ref_id")
    private Long sourceRefId;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(length = 100)
    private String reference;

    @Column(name = "mode_paiement")
    private String modePaiement;

    private String statut;

    private String utilisateur;

    @Column(name = "type_operation")
    private String typeOperation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_bancaire_id")
    private CompteBancaire compteBancaire;

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDateTime.now();
        }
    }
}
