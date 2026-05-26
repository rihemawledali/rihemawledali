package com.project_pfe_srt.project_srt.common.profile.dto;

import com.project_pfe_srt.project_srt.adherent.profile.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProfileResponseDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private String status;
    private String matricule;
    private String createdAt;
    private AdherentDetails adherent;

    @Getter
    @Builder
    public static class AdherentDetails {
        private Double salaire;
        private Integer enfants;
        private Boolean marie;
        private String dateNaissance;
    }

    public static ProfileResponseDTO from(User user, AdherentProfile adherentProfile) {
        return ProfileResponseDTO.builder()
                .id(user.getId().toString())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .email(user.getEmail())
                .phone(user.getTelephone())
                .role(mapRole(user.getRole()))
                .status(user.getStatut() == null ? "actif" : user.getStatut().toLowerCase())
                .matricule(user.getMatricule())
                .createdAt(user.getCreatedAt() == null ? null : user.getCreatedAt().toString())
                .adherent(mapAdherentDetails(adherentProfile))
                .build();
    }

    private static AdherentDetails mapAdherentDetails(AdherentProfile profile) {
        if (profile == null) {
            return null;
        }

        return AdherentDetails.builder()
                .salaire(profile.getSalaire())
                .enfants(profile.getEnfants())
                .marie(profile.getMarie())
                .dateNaissance(profile.getDateNaissance() == null ? null : profile.getDateNaissance().toString())
                .build();
    }

    private static String mapRole(Role role) {
        return switch (role) {
            case ADMIN -> "admin";
            case TRESORIER -> "treasurer";
            case ADHERENT -> "adherent";
        };
    }
}
