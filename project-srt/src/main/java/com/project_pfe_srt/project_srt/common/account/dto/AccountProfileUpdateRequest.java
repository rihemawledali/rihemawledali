package com.project_pfe_srt.project_srt.common.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountProfileUpdateRequest {

    @NotBlank(message = "Le prenom est requis.")
    private String firstName;

    @NotBlank(message = "Le nom est requis.")
    private String lastName;

    @Email(message = "Email invalide.")
    @NotBlank(message = "Email requis.")
    private String email;

    private String phone;
}
