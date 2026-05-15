package com.project_pfe_srt.project_srt.shared.tresorerie.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepotManuelRequest {
    private Double montant;
    private String description;
}
