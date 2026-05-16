package com.project_pfe_srt.project_srt.admin.adhesions.controller;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/adhesions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAdhesionController {

    private final AdhesionService adhesionService;

    @GetMapping
    public List<AdhesionDto> listAdhesions() {
        return adhesionService.listAll();
    }

    @GetMapping("/{id}")
    public AdhesionDto getAdhesion(@PathVariable Long id) {
        return adhesionService.getById(id);
    }

    @PutMapping("/{id}/valider")
    public AdhesionDto validerAdhesion(@PathVariable Long id) {
        return adhesionService.valider(id);
    }
    @PutMapping("/{id}/rejeter")
    public AdhesionDto rejeterAdhesion(@PathVariable Long id) {
        return adhesionService.rejeter(id);
    }
}
