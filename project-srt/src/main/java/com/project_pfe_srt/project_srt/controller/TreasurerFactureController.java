package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.FactureRequest;
import com.project_pfe_srt.project_srt.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.service.FacturePdfService;
import com.project_pfe_srt.project_srt.service.FactureService;
import com.project_pfe_srt.project_srt.service.PaiementService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/factures")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerFactureController {

    private final FactureService factureService;
    private final PaiementService paiementService;
    private final AuthUtils authUtils;
    private final FacturePdfService facturePdfService;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(factureService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(factureService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FactureRequest req) {
        try {
            return ResponseEntity.ok(factureService.create(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody FactureRequest req) {
        try {
            return ResponseEntity.ok(factureService.update(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<?> annuler(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(factureService.annuler(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Pay a facture: creates a Paiement + drives the workflow. */
    @PostMapping("/{id}/payer")
    public ResponseEntity<?> payer(@PathVariable Long id, @RequestBody PaiementRequest req) {
        try {
            return ResponseEntity.ok(paiementService.payFacture(id, req, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Render the facture as a formal-invoice PDF (on-demand, not stored).
     * Uses the reusable HTML template under
     * {@code resources/templates/pdf/facture.html}.
     */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            byte[] pdf = facturePdfService.render(id);
            String filename = facturePdfService.suggestedFilename(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            factureService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Facture supprimée."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
