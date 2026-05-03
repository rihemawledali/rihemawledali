package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.CompteBancaire;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompteBancaireDto {
    private String id;
    private String banque;
    private String iban;
    private Double solde;
    private String devise;

    public static CompteBancaireDto from(CompteBancaire c) {
        if (c == null) return null;
        return CompteBancaireDto.builder()
                .id(c.getId().toString())
                .banque(c.getBanque())
                .iban(c.getIban())
                .solde(c.getSolde())
                .devise(c.getDevise())
                .build();
    }
}
