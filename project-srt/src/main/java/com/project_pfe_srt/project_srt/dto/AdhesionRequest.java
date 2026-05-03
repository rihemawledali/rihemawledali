package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdhesionRequest {
    private Double montantCotisation;
    private String dateDebut;
    private String dateFin;
}
