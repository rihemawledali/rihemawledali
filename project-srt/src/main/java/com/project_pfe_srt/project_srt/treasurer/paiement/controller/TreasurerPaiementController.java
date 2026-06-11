package com.project_pfe_srt.project_srt.treasurer.paiement.controller;

import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementDto;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.treasurer.paiement.service.PaiementService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/paiements")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerPaiementController {

    private final PaiementService paiementService;
    private final AuthUtils authUtils;

    @GetMapping
    public List<PaiementDto> list() {
        return paiementService.list();
    }

    @GetMapping("/{id}")
    public PaiementDto get(@PathVariable Long id) {
        return paiementService.getById(id);
    }

    /** Generic creation (preferred for {@code AUTRE_SORTIE}). */
    @PostMapping
    public PaiementDto create(@RequestBody PaiementRequest req) {
        return paiementService.create(req, authUtils.currentDisplayName());
    }

    /** Pay a validated indemnité. */
    @PostMapping("/payer-indemnite/{indemniteId}")
    public PaiementDto payerIndemnite(@PathVariable Long indemniteId, @RequestBody PaiementRequest req) {
        return paiementService.payIndemnite(indemniteId, req, authUtils.currentDisplayName());
    }

    @PutMapping("/{id}/valider")
    public PaiementDto valider(@PathVariable Long id) {
        return paiementService.valider(id, authUtils.currentDisplayName());
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        paiementService.delete(id);
        return Map.of("message", "Paiement supprimé.");
    }
}
