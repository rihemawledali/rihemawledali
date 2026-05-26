package com.project_pfe_srt.project_srt.treasurer.facture.controller;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionFactureGenerationRequest;
import com.project_pfe_srt.project_srt.shared.pdf.service.FacturePdfService;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureDto;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureRequest;
import com.project_pfe_srt.project_srt.treasurer.facture.service.FactureService;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementDto;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.treasurer.paiement.service.PaiementService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public List<FactureDto> list() {
        return factureService.list();
    }

    @GetMapping("/{id}")
    public FactureDto get(@PathVariable Long id) {
        return factureService.getById(id);
    }

    @PostMapping
    public FactureDto create(@RequestBody FactureRequest req) {
        return factureService.create(req);
    }

    @GetMapping("/conventions/eligible")
    public List<ConventionDemandeDto> eligibleConventionDemandes(
            @RequestParam Long fournisseurId,
            @RequestParam Integer mois,
            @RequestParam Integer annee) {
        return factureService.eligibleConventionDemandes(fournisseurId, mois, annee);
    }

    @PostMapping("/conventions/generer")
    public FactureDto genererConventionFacture(@RequestBody ConventionFactureGenerationRequest req) {
        return factureService.generateConventionFacture(req);
    }

    @GetMapping("/{id}/convention-demandes")
    public List<ConventionDemandeDto> conventionFactureDetails(@PathVariable Long id) {
        return factureService.conventionFactureDetails(id);
    }

    @PutMapping("/{id}/valider-convention")
    public FactureDto validerConventionFacture(@PathVariable Long id) {
        return factureService.validerConventionFacture(id);
    }

    @PutMapping("/{id}")
    public FactureDto update(@PathVariable Long id, @RequestBody FactureRequest req) {
        return factureService.update(id, req);
    }

    @PutMapping("/{id}/annuler")
    public FactureDto annuler(@PathVariable Long id) {
        return factureService.annuler(id);
    }

    /** Pay a facture: creates a Paiement + drives the workflow. */
    @PostMapping("/{id}/payer")
    public PaiementDto payer(@PathVariable Long id, @RequestBody PaiementRequest req) {
        return paiementService.payFacture(id, req, authUtils.currentDisplayName());
    }

    /**
     * Render the facture as a formal-invoice PDF (on-demand, not stored).
     * Uses the template under {@code resources/templates/pdf/facture.html}.
     */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = facturePdfService.render(id);
        String filename = facturePdfService.suggestedFilename(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        factureService.delete(id);
        return Map.of("message", "Facture supprimée.");
    }
}
