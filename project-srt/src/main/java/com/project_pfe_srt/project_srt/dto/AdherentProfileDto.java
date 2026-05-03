package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.entity.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdherentProfileDto {
    private String id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String role;
    private String status;
    private String matricule;
    private String createdAt;

    private Double salaire;
    private Integer enfants;
    private Boolean marie;
    private String dateNaissance; // ISO yyyy-MM-dd

    public static AdherentProfileDto from(User u, AdherentProfile p) {
        return AdherentProfileDto.builder()
                .id(u.getId().toString())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .telephone(u.getTelephone())
                .role("adherent")
                .status(u.getStatut() == null ? "actif" : u.getStatut().toLowerCase())
                .matricule(u.getMatricule())
                .createdAt(u.getCreatedAt() == null ? null : u.getCreatedAt().toString())
                .salaire(p == null ? null : p.getSalaire())
                .enfants(p == null ? null : p.getEnfants())
                .marie(p == null ? null : p.getMarie())
                .dateNaissance(p == null || p.getDateNaissance() == null ? null : p.getDateNaissance().toString())
                .build();
    }
}
