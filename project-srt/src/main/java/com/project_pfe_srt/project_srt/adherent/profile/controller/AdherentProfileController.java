package com.project_pfe_srt.project_srt.adherent.profile.controller;

import com.project_pfe_srt.project_srt.adherent.profile.dto.ChangePasswordRequest;
import com.project_pfe_srt.project_srt.adherent.profile.dto.ProfileUpdateRequest;
import com.project_pfe_srt.project_srt.adherent.profile.service.AdherentProfileService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentProfileController {

    private final AdherentProfileService profileService;
    private final AuthUtils authUtils;

    @GetMapping
    public Object getProfile() {
        return profileService.getProfileDto(authUtils.currentAdherent());
    }

    @PutMapping
    public Object updateProfile(@RequestBody ProfileUpdateRequest req) {
        return profileService.update(authUtils.currentAdherent(), req);
    }

    @PostMapping("/password")
    public Object changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        profileService.changePassword(authUtils.currentAdherent(), req);
        return Map.of("ok", true);
    }
}
