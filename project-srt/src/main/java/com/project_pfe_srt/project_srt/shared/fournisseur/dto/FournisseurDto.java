package com.project_pfe_srt.project_srt.shared.fournisseur.dto;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FournisseurDto {
    private String id;
    private String nom;
    private String adresse;
    private String telephone;
    private String email;
    private String categorie;
    private String status;
    private String createdAt;

    public static FournisseurDto from(Fournisseur f) {
        return FournisseurDto.builder()
                .id(f.getId().toString())
                .nom(f.getNom())
                .adresse(f.getAdresse())
                .telephone(f.getTelephone())
                .email(f.getEmail())
                .categorie(f.getCategorie())
                .status(f.getStatus())
                .createdAt(f.getCreatedAt() == null ? null : f.getCreatedAt().toString())
                .build();
    }
}
