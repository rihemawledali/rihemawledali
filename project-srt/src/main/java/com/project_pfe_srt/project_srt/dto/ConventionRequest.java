package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConventionRequest {
    private String fournisseurId;
    private String type;
    private String dateDebut; // yyyy-MM-dd
    private String dateFin;
    private Double remise;
    private String statut;
    private String description;

    // ----- Mode d'avantage (nouveaux champs) -----
    /** Optional free-text convention kind (e.g. partenariat, cadre). */
    private String typeConvention;
    /** One of REMISE_POURCENTAGE | REMISE_MONTANT_FIXE | SUBVENTION_AMICALE | PRIX_NEGOCIE | AUTRE. */
    private String modeAvantage;
    private Double tauxReduction;
    private Double montantReduction;
    private String descriptionAvantage;
}
