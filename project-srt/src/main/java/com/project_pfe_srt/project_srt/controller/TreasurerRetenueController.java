package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.RetenueGenerateRequest;
import com.project_pfe_srt.project_srt.service.RetenueService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/retenues")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerRetenueController {

    private final RetenueService service;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Integer mois,
            @RequestParam(required = false) Integer annee
    ) {
        if (mois != null && annee != null) {
            return ResponseEntity.ok(service.listByPeriod(mois, annee));
        }
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Idempotent monthly generation: refreshes lines for every adhérent for
     * the given (mois, annee). Defaults to the current month when omitted.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody(required = false) RetenueGenerateRequest req) {
        try {
            Integer m = req == null ? null : req.getMois();
            Integer y = req == null ? null : req.getAnnee();
            return ResponseEntity.ok(service.generate(m, y));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Advance / revert a master + its lignes to a target statut. Allowed
     * transitions are the two steps of the simplified workflow:
     * {@code GENEREE ⇄ EXPORTEE}. The export helpers below also perform
     * the forward transition automatically when they produce the file.
     */
    @PutMapping("/{id}/statut")
    public ResponseEntity<?> setStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String target = body == null ? null : body.get("statut");
            return ResponseEntity.ok(service.setStatut(id, target, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Update one ligne's statut (vocabulary: GENEREE | EN_ATTENTE | PRELEVEE | ANNULEE). */
    @PutMapping("/{retenueId}/lignes/{ligneId}/statut")
    public ResponseEntity<?> setLigneStatut(@PathVariable Long retenueId,
                                            @PathVariable Long ligneId,
                                            @RequestBody Map<String, String> body) {
        try {
            String target = body == null ? null : body.get("statut");
            return ResponseEntity.ok(service.setLigneStatut(retenueId, ligneId, target));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Force a single retenue to recompute its lignes from the live data
     * (active adhésion + en_cours prêts). Useful when an adhésion was
     * activated after the master was already created/exported.
     */
    @PostMapping("/{id}/regenerate")
    public ResponseEntity<?> regenerate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.regenerate(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Recent retenues for one adhérent. */
    @GetMapping("/history/{adherentId}")
    public ResponseEntity<?> historyForAdherent(@PathVariable Long adherentId) {
        return ResponseEntity.ok(service.historyForAdherent(adherentId));
    }

    /** Export one retenue (master + lignes) as CSV. Also flips it to EXPORTEE. */
    @PostMapping("/{id}/export")
    public ResponseEntity<?> exportOne(@PathVariable Long id) {
        try {
            RetenueService.CsvExport out = service.exportToCsv(id);
            return csvResponse(out);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Export every retenue for a (mois, annee) period as a single CSV. */
    @PostMapping("/export")
    public ResponseEntity<?> exportPeriod(@RequestParam int mois, @RequestParam int annee) {
        try {
            RetenueService.CsvExport out = service.exportPeriodToCsv(mois, annee);
            return csvResponse(out);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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
