package com.project_pfe_srt.project_srt.treasurer.retenue.controller;

import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.treasurer.retenue.dto.RetenueGenerateRequest;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Trésorier endpoints for retenues mensuelles. Validation errors and
 * "not found" cases are handled uniformly by {@code GlobalExceptionHandler},
 * which is why this controller is free of try/catch noise.
 */
@RestController
@RequestMapping("/api/treasurer/retenues")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerRetenueController {

    private final RetenueService service;
    private final AuthUtils authUtils;

    @GetMapping
    public Object list(
            @RequestParam(required = false) Integer mois,
            @RequestParam(required = false) Integer annee) {
        return (mois != null && annee != null)
                ? service.listByPeriod(mois, annee)
                : service.list();
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Long id) {
        return service.getById(id);
    }

    /**
     * Idempotent monthly generation: refreshes lines for every adhérent
     * for the given (mois, annee). Defaults to the current month when
     * omitted.
     */
    @PostMapping("/generate")
    public Object generate(@RequestBody(required = false) RetenueGenerateRequest req) {
        Integer m = req == null ? null : req.getMois();
        Integer y = req == null ? null : req.getAnnee();
        return service.generate(m, y);
    }

    /**
     * Advance / revert a master + its lignes to a target statut. Allowed
     * transitions: {@code GENEREE ⇄ EXPORTEE}.
     */
    @PutMapping("/{id}/statut")
    public Object setStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String target = body == null ? null : body.get("statut");
        return service.setStatut(id, target, authUtils.currentDisplayName());
    }

    /** Update one ligne's statut (GENEREE | EN_ATTENTE | PRELEVEE | ANNULEE). */
    @PutMapping("/{retenueId}/lignes/{ligneId}/statut")
    public Object setLigneStatut(@PathVariable Long retenueId,
                                 @PathVariable Long ligneId,
                                 @RequestBody Map<String, String> body) {
        String target = body == null ? null : body.get("statut");
        return service.setLigneStatut(retenueId, ligneId, target);
    }

    /** Force a single retenue to recompute its lignes from live data. */
    @PostMapping("/{id}/regenerate")
    public Object regenerate(@PathVariable Long id) {
        return service.regenerate(id);
    }

    /** Recent retenues for one adhérent. */
    @GetMapping("/history/{adherentId}")
    public Object historyForAdherent(@PathVariable Long adherentId) {
        return service.historyForAdherent(adherentId);
    }

    /** Export one retenue as CSV. Also flips it to EXPORTEE. */
    @PostMapping("/{id}/export")
    public ResponseEntity<byte[]> exportOne(@PathVariable Long id) {
        return csvResponse(service.exportToCsv(id));
    }

    /** Export every retenue of a period as a single CSV. */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportPeriod(@RequestParam int mois, @RequestParam int annee) {
        return csvResponse(service.exportPeriodToCsv(mois, annee));
    }

    // ---- helpers --------------------------------------------------------

    private static ResponseEntity<byte[]> csvResponse(RetenueService.CsvExport out) {
        String encoded = URLEncoder.encode(out.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        String cd = "attachment; filename=\"" + out.filename() + "\"; filename*=UTF-8''" + encoded;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd)
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(out.content());
    }
}
