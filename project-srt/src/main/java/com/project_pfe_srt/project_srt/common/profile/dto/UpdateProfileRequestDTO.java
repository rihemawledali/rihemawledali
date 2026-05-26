package com.project_pfe_srt.project_srt.common.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequestDTO {

    @NotBlank(message = "Le prenom est requis.")
    private String firstName;

    @NotBlank(message = "Le nom est requis.")
    private String lastName;

    private String phone;

    private String currentPassword;

    @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caracteres.")
    private String newPassword;
}
