package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String id;
    private String token;
    private String role; // lowercase: admin | adherent | treasurer | manager
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
}
