package com.project_pfe_srt.project_srt.shared.convention.dto;

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

    /** Optional free-text convention kind (e.g. partenariat, cadre). */
    private String typeConvention;

    // ----- Type d'avantage convention -----
    private String typeAvantage;
    private Double pourcentageAdherent;
    private Double montantAvantage;
    private Integer nombreMoisRetenue;
    private Integer quantiteDisponible;
    private Boolean autoriseAyantsDroit;
    private Long documentConventionId;
}
