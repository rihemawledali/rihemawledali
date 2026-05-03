package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.AdhesionRequest;
import com.project_pfe_srt.project_srt.service.AdhesionService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public ResponseEntity<?> create(@RequestBody AdhesionRequest req) {
        try {
            return ResponseEntity.ok(adhesionService.create(authUtils.currentAdherent(), req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel() {
        try {
            return ResponseEntity.ok(adhesionService.cancel(authUtils.currentAdherent()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/renew")
    public ResponseEntity<?> renew() {
        return ResponseEntity.ok(adhesionService.renew(authUtils.currentAdherent()));
    }
}
