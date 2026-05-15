package com.project_pfe_srt.project_srt.treasurer.retenue.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Detail row attached to a {@link RetenueMensuelle}. One row per source
 * (cotisation, prêt, convention) for a given month.
 */
@Entity
@Table(name = "retenues_lignes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "retenue_id", nullable = false)
    private RetenueMensuelle retenue;

    /** COTISATION | PRET | CONVENTION */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Double montant;

    @Column(length = 500)
    private String libelle;

    /** Optional reference id of the source entity (pretId, conventionId, …). */
    @Column(name = "source_ref_id")
    private Long sourceRefId;

    /** GENEREE | EN_ATTENTE | PRELEVEE | ANNULEE */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "GENEREE";
}
