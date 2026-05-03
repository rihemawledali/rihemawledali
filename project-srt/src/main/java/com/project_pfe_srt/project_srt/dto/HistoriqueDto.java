package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.HistoriqueFinanciere;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueDto {
    private String id;
    private String type;
    private String description;
    private Double montant;
    private String date;
    private String reference;

    public static HistoriqueDto from(HistoriqueFinanciere h) {
        if (h == null) return null;
        return HistoriqueDto.builder()
                .id(h.getId().toString())
                .type(h.getType())
                .description(h.getDescription())
                .montant(h.getMontant())
                .date(h.getDate() == null ? null : h.getDate().toString())
                .reference(h.getReference())
                .build();
    }
}
