package com.project_pfe_srt.project_srt.common.account.controller;

import com.project_pfe_srt.project_srt.common.account.dto.AccountPasswordRequest;
import com.project_pfe_srt.project_srt.common.account.dto.AccountProfileDto;
import com.project_pfe_srt.project_srt.common.account.dto.AccountProfileUpdateRequest;
import com.project_pfe_srt.project_srt.common.account.service.AccountProfileService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/account/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AccountProfileController {

    private final AccountProfileService accountProfileService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<AccountProfileDto> getProfile() {
        return ResponseEntity.ok(accountProfileService.getProfile(authUtils.currentUser()));
    }

    @PutMapping
    public ResponseEntity<AccountProfileDto> updateProfile(@Valid @RequestBody AccountProfileUpdateRequest request) {
        return ResponseEntity.ok(accountProfileService.updateProfile(authUtils.currentUser(), request));
    }

    @PostMapping("/password")
    public ResponseEntity<Map<String, Boolean>> changePassword(@Valid @RequestBody AccountPasswordRequest request) {
        accountProfileService.changePassword(authUtils.currentUser(), request);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
