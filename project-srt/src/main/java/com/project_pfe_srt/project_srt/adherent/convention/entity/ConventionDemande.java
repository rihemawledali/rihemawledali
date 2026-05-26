package com.project_pfe_srt.project_srt.adherent.convention.entity;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;

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

    /** SOUMISE | APPROUVEE | EN_COURS | JUSTIFIEE | VALIDEE | FACTUREE | PAYEE | REFUSEE | ANNULEE */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "SOUMISE";

    @Column(name = "date_decision")
    private LocalDate dateDecision;

    @Column(name = "motif_refus", length = 1000)
    private String motifRefus;

    @Column(length = 1000)
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id")
    private Facture facture;

    @Column(name = "facture_mois")
    private Integer factureMois;

    @Column(name = "facture_annee")
    private Integer factureAnnee;

    @Column(name = "montant_total")
    private Double montantTotal;

    @Column(name = "montant_adherent")
    private Double montantAdherent;

    @Column(name = "montant_amicale")
    private Double montantAmicale;

    @Column(name = "retenue_mois_debut")
    private Integer retenueMoisDebut;

    @Column(name = "retenue_annee_debut")
    private Integer retenueAnneeDebut;

    @Column(name = "retenue_nombre_mois")
    private Integer retenueNombreMois;

    @Column(name = "retenue_montant_mensuel")
    private Double retenueMontantMensuel;
}
