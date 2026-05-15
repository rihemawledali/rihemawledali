package com.project_pfe_srt.project_srt.common.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountPasswordRequest {

    @NotBlank(message = "Mot de passe actuel requis.")
    private String currentPassword;

    @NotBlank(message = "Nouveau mot de passe requis.")
    @Size(min = 8, message = "Le nouveau mot de passe doit faire au moins 8 caracteres.")
    private String newPassword;
}
