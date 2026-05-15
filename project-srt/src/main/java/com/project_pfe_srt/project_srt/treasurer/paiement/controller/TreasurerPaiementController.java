package com.project_pfe_srt.project_srt.treasurer.paiement.controller;

import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.treasurer.paiement.service.PaiementService;

import lombok.RequiredArgsConstructor;
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
    public Object list() {
        return paiementService.list();
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Long id) {
        return paiementService.getById(id);
    }

    /** Generic creation (preferred for {@code AUTRE_SORTIE}). */
    @PostMapping
    public Object create(@RequestBody PaiementRequest req) {
        return paiementService.create(req, authUtils.currentDisplayName());
    }

    /** Pay a validated indemnité. */
    @PostMapping("/payer-indemnite/{indemniteId}")
    public Object payerIndemnite(@PathVariable Long indemniteId, @RequestBody PaiementRequest req) {
        return paiementService.payIndemnite(indemniteId, req, authUtils.currentDisplayName());
    }

    @PutMapping("/{id}/valider")
    public Object valider(@PathVariable Long id) {
        return paiementService.valider(id, authUtils.currentDisplayName());
    }

    @PutMapping("/{id}/annuler")
    public Object annuler(@PathVariable Long id) {
        return paiementService.annuler(id);
    }

    @DeleteMapping("/{id}")
    public Object delete(@PathVariable Long id) {
        paiementService.delete(id);
        return Map.of("message", "Paiement supprimé.");
    }
}
