package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String dateNaissance; // yyyy-MM-dd
    private Double salaire;
    private Integer enfants;
    private Boolean marie;
}
