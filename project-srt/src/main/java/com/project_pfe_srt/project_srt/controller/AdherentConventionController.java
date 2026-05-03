package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.ConventionDemandeRequest;
import com.project_pfe_srt.project_srt.service.ConventionAdherentService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentConventionController {

    private final ConventionAdherentService service;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(service.listConventions(authUtils.currentAdherent()));
    }

    @GetMapping("/demandes")
    public ResponseEntity<?> myDemandes() {
        return ResponseEntity.ok(service.listMyDemandes(authUtils.currentAdherent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getConvention(authUtils.currentAdherent(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/demandes")
    public ResponseEntity<?> createDemande(@RequestBody ConventionDemandeRequest req) {
        try {
            return ResponseEntity.ok(service.createDemande(authUtils.currentAdherent(), req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/demandes/{id}/cancel")
    public ResponseEntity<?> cancelDemande(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.cancelDemande(authUtils.currentAdherent(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
