package com.project_pfe_srt.project_srt.common.profile.controller;

import com.project_pfe_srt.project_srt.common.profile.dto.ProfileResponseDTO;
import com.project_pfe_srt.project_srt.common.profile.dto.UpdateProfileRequestDTO;
import com.project_pfe_srt.project_srt.common.profile.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ProfileResponseDTO getMe(Authentication authentication) {
        return profileService.getConnectedUserProfile(authentication.getName());
    }

    @PutMapping("/me")
    public ProfileResponseDTO updateMe(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        return profileService.updateConnectedUserProfile(authentication.getName(), request);
    }
}
