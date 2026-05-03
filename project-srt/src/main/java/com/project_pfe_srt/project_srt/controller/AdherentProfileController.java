package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.ChangePasswordRequest;
import com.project_pfe_srt.project_srt.dto.ProfileUpdateRequest;
import com.project_pfe_srt.project_srt.service.AdherentProfileService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> getProfile() {
        return ResponseEntity.ok(profileService.getProfileDto(authUtils.currentAdherent()));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest req) {
        try {
            return ResponseEntity.ok(profileService.update(authUtils.currentAdherent(), req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        try {
            profileService.changePassword(authUtils.currentAdherent(), req);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
