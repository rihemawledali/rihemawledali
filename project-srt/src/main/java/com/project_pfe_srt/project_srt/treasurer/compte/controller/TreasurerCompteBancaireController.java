package com.project_pfe_srt.project_srt.treasurer.compte.controller;

import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.CompteBancaireRequest;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.DepotManuelRequest;
import com.project_pfe_srt.project_srt.treasurer.compte.service.CompteBancaireService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/comptes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerCompteBancaireController {

    private final CompteBancaireService service;
    private final AuthUtils authUtils;

    @GetMapping
    public Object list() {
        return service.list();
    }

    @PostMapping
    public Object create(@RequestBody CompteBancaireRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public Object update(@PathVariable Long id, @RequestBody CompteBancaireRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Object delete(@PathVariable Long id) {
        service.delete(id);
        return Map.of("message", "Compte supprimé.");
    }

    @PostMapping("/{id}/depot")
    public Object depot(@PathVariable Long id, @RequestBody DepotManuelRequest req) {
        return service.deposerManuellement(id, req, authUtils.currentDisplayName());
    }
}
