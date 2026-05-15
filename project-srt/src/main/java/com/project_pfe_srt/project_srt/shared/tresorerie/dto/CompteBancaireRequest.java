package com.project_pfe_srt.project_srt.shared.tresorerie.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompteBancaireRequest {
    private String banque;
    private String iban;
    private Double solde;
    private String devise;
}
