package com.project_pfe_srt.project_srt.common.account.dto;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountProfileDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private String statut;
    private String matricule;
    private String createdAt;
    private String token;

    public static AccountProfileDto from(User user, String token) {
        return AccountProfileDto.builder()
                .id(user.getId().toString())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .email(user.getEmail())
                .phone(user.getTelephone())
                .role(mapRole(user.getRole()))
                .statut(user.getStatut() == null ? "actif" : user.getStatut().toLowerCase())
                .matricule(user.getMatricule())
                .createdAt(user.getCreatedAt() == null ? null : user.getCreatedAt().toString())
                .token(token)
                .build();
    }

    private static String mapRole(Role role) {
        return switch (role) {
            case TRESORIER -> "treasurer";
            case ADMIN -> "admin";
            case ADHERENT -> "adherent";
        };
    }
}
