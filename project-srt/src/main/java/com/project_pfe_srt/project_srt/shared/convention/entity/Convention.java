package com.project_pfe_srt.project_srt.shared.convention.entity;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;

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

    /** Legacy global discount in percent (0-100). Kept for backward compatibility. */
    @Column
    private Double remise;

    /** Lowercase: active | expiree | en_negociation | suspendue */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "active";

    @Column(length = 1000)
    private String description;

    // ---------------------------------------------------------------
    // Type d'avantage convention.
    // Le champ legacy {@link #type} (sante/restauration/...) reste la
    // categorie metier de la convention; {@code typeConvention} decrit
    // le format du contrat (ex. partenariat, cadre, offre ponctuelle).
    // ---------------------------------------------------------------

    /** Optional free-text convention kind (e.g. partenariat, cadre, offre). */
    @Column(name = "type_convention", length = 80)
    private String typeConvention;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_avantage", length = 40)
    private TypeAvantage typeAvantage;

    /** Part payee par l'adherent, en pourcentage du montant d'avantage. */
    @Column(name = "pourcentage_adherent")
    private Double pourcentageAdherent;

    /** Montant de reference: bon d'achat, abonnement mensuel, achat tranche, etc. */
    @Column(name = "montant_avantage")
    private Double montantAvantage;

    /** Nombre de mensualites pour ACHAT_TRANCHE. */
    @Column(name = "nombre_mois_retenue")
    private Integer nombreMoisRetenue;

    @Column(name = "quantite_disponible")
    private Integer quantiteDisponible;

    @Builder.Default
    @Column(name = "autorise_ayants_droit")
    private Boolean autoriseAyantsDroit = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_convention_id")
    private Attachment documentConvention;
}
