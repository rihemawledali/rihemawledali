package com.project_pfe_srt.project_srt.admin.adhesions.controller;

import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/adhesions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAdhesionController {

    private final AdhesionService adhesionService;

    @GetMapping
    public Object listAdhesions() {
        return adhesionService.listAll();
    }

    @GetMapping("/{id}")
    public Object getAdhesion(@PathVariable Long id) {
        return adhesionService.getById(id);
    }

    @PutMapping("/{id}/valider")
    public Object validerAdhesion(@PathVariable Long id) {
        return adhesionService.valider(id);
    }

    /**
     * Reject an adhésion. The body may contain {@code { "motif": ... }};
     * the motif is accepted but not yet persisted (reserved for a future
     * audit log).
     */
    @PutMapping("/{id}/rejeter")
    public Object rejeterAdhesion(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return adhesionService.rejeter(id);
    }
}
