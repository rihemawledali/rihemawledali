package com.project_pfe_srt.project_srt.dto;

import lombok.*;

/**
 * Body for `POST /api/treasurer/retenues/generate?mois=&annee=`.
 * Both fields are optional — defaults to the current month/year.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueGenerateRequest {
    private Integer mois;
    private Integer annee;
}
