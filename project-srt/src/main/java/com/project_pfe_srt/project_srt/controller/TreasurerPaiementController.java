package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.service.PaiementService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/paiements")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerPaiementController {

    private final PaiementService paiementService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(paiementService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(paiementService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Generic creation (preferred for `AUTRE_SORTIE`). */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody PaiementRequest req) {
        try {
            return ResponseEntity.ok(paiementService.create(req, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Pay a fournisseur facture (alternative to `/factures/{id}/payer`). */
    @PostMapping("/payer-facture/{factureId}")
    public ResponseEntity<?> payerFacture(@PathVariable Long factureId, @RequestBody PaiementRequest req) {
        try {
            return ResponseEntity.ok(paiementService.payFacture(factureId, req, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Pay a validated indemnité. */
    @PostMapping("/payer-indemnite/{indemniteId}")
    public ResponseEntity<?> payerIndemnite(@PathVariable Long indemniteId, @RequestBody PaiementRequest req) {
        try {
            return ResponseEntity.ok(paiementService.payIndemnite(indemniteId, req, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<?> valider(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(paiementService.valider(id, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<?> annuler(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(paiementService.annuler(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            paiementService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Paiement supprimé."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
