package com.project_pfe_srt.project_srt.treasurer.boncommande.controller;

import com.project_pfe_srt.project_srt.shared.pdf.service.BonCommandePdfService;
import com.project_pfe_srt.project_srt.treasurer.boncommande.dto.BonCommandeRequest;
import com.project_pfe_srt.project_srt.treasurer.boncommande.service.BonCommandeService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/bons-commande")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerBonCommandeController {

    private final BonCommandeService service;
    private final BonCommandePdfService pdfService;

    @GetMapping
    public Object list() {
        return service.list();
    }

    /** Detail view: bon fields + the tickets generated from it. */
    @GetMapping("/{id}")
    public Object get(@PathVariable Long id) {
        return service.getById(id);
    }

    /** Move the bon from {@code brouillon} to {@code valide}. */
    @PostMapping("/{id}/valider")
    public Object valider(@PathVariable Long id) {
        return service.valider(id);
    }

    @PostMapping
    public Object create(@RequestBody BonCommandeRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public Object update(@PathVariable Long id, @RequestBody BonCommandeRequest req) {
        return service.update(id, req);
    }

    /**
     * Render the purchase-order PDF for a bon de commande. Validation
     * errors and missing-id surface as 4xx via the global exception handler.
     */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = pdfService.render(id);
        String filename = pdfService.suggestedFilename(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @DeleteMapping("/{id}")
    public Object delete(@PathVariable Long id) {
        service.delete(id);
        return Map.of("message", "Bon de commande supprimé.");
    }
}
