package com.project_pfe_srt.project_srt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Payload used by AdminController for creating or updating a user.
 * On create, password is required.
 * On update, password is optional (null = keep current).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String role;        // admin | adherent | treasurer | manager

    private String statut;      // actif | inactif | suspendu (defaults to actif on create)
    private String phone;
    private String matricule;
    private String password;    // optional on update, required on create
}
