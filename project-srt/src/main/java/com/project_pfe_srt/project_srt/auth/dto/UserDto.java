package com.project_pfe_srt.project_srt.auth.dto;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;       // lowercase: admin | adherent | treasurer
    private String statut;     // lowercase: actif | inactif | suspendu
    private String matricule;
    private String createdAt;  // ISO string

    /** Maps internal role enum to lowercase frontend value (TRESORIER -> treasurer). */
    private static String mapRole(Role role) {
        return switch (role) {
            case TRESORIER -> "treasurer";
            case ADMIN -> "admin";
            case ADHERENT -> "adherent";
        };
    }

    private static String mapStatut(String s) {
        if (s == null) return "actif";
        return s.toLowerCase();
    }

    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId().toString())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .email(user.getEmail())
                .phone(user.getTelephone())
                .role(mapRole(user.getRole()))
                .statut(mapStatut(user.getStatut()))
                .matricule(user.getMatricule())
                .createdAt(user.getCreatedAt() == null ? null : user.getCreatedAt().toString())
                .build();
    }
}
