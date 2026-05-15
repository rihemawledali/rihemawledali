package com.project_pfe_srt.project_srt.treasurer.workflow.controller;

import com.project_pfe_srt.project_srt.treasurer.workflow.service.TreasurerConventionService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Trésorier endpoints for convention demandes:
 * <ul>
 *   <li>GET  /api/treasurer/conventions/demandes              — list (all, newest first)</li>
 *   <li>GET  /api/treasurer/conventions/demandes/{id}         — one</li>
 *   <li>PUT  /api/treasurer/conventions/demandes/{id}/valider — approve</li>
 *   <li>PUT  /api/treasurer/conventions/demandes/{id}/refuser — reject (optional {@code { motif }})</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/treasurer/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerConventionController {

    private final TreasurerConventionService service;

    @GetMapping("/demandes")
    public Object list() {
        return service.listDemandes();
    }

    @GetMapping("/demandes/{id}")
    public Object getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/demandes/{id}/valider")
    public Object valider(@PathVariable Long id) {
        return service.valider(id);
    }

    @PutMapping("/demandes/{id}/refuser")
    public Object refuser(@PathVariable Long id,
                          @RequestBody(required = false) Map<String, String> body) {
        String motif = body == null ? null : body.get("motif");
        return service.refuser(id, motif);
    }
}
