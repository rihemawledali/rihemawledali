package com.project_pfe_srt.project_srt.adherent.adhesion.controller;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionRequest;
import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/adherent/adhesion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentAdhesionController {

    private final AdhesionService adhesionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> current() {
        return ResponseEntity.ok(adhesionService.getCurrent(authUtils.currentAdherent()));
    }

    @GetMapping("/history")
    public ResponseEntity<?> history() {
        return ResponseEntity.ok(adhesionService.getHistory(authUtils.currentAdherent()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AdhesionRequest request) {
        return ResponseEntity.ok(adhesionService.create(authUtils.currentAdherent(), request));
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel() {
        return ResponseEntity.ok(adhesionService.cancel(authUtils.currentAdherent()));
    }

    @PostMapping("/renew")
    public ResponseEntity<?> renew() {
        return ResponseEntity.ok(adhesionService.renew(authUtils.currentAdherent()));
    }
}
