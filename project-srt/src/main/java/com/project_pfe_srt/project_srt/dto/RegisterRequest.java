package com.project_pfe_srt.project_srt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank
    private String firstName; // maps to prenom

    @NotBlank
    private String lastName;  // maps to nom

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    private String role; // admin | adherent | treasurer | manager

    private String phone; // maps to telephone
}
