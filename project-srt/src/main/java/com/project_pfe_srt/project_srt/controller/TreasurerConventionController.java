package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.service.TreasurerConventionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Treasurer endpoints for convention demandes:
 *   GET  /api/treasurer/conventions/demandes              → list (all, newest first)
 *   GET  /api/treasurer/conventions/demandes/{id}         → one
 *   PUT  /api/treasurer/conventions/demandes/{id}/valider → approve
 *   PUT  /api/treasurer/conventions/demandes/{id}/refuser → reject (optional { motif })
 */
@RestController
@RequestMapping("/api/treasurer/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerConventionController {

    private final TreasurerConventionService service;

    @GetMapping("/demandes")
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(service.listDemandes());
    }

    @GetMapping("/demandes/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/demandes/{id}/valider")
    public ResponseEntity<?> valider(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.valider(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/demandes/{id}/refuser")
    public ResponseEntity<?> refuser(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body) {
        try {
            String motif = body == null ? null : body.get("motif");
            return ResponseEntity.ok(service.refuser(id, motif));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
