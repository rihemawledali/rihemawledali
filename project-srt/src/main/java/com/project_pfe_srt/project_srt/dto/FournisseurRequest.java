package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FournisseurRequest {
    private String nom;
    private String adresse;
    private String telephone;
    private String email;
    private String categorie;
    private String status;
}
