package com.project_pfe_srt.project_srt.adherent.convention.controller;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionAdherentDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeRequest;
import com.project_pfe_srt.project_srt.adherent.convention.service.ConventionAdherentService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adherent/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentConventionController {

    private final ConventionAdherentService service;
    private final AuthUtils authUtils;

    @GetMapping
    public List<ConventionAdherentDto> list() {
        return service.listConventions(authUtils.currentAdherent());
    }

    @GetMapping("/demandes")
    public List<ConventionDemandeDto> myDemandes() {
        return service.listMyDemandes(authUtils.currentAdherent());
    }

    @GetMapping("/{id}")
    public ConventionAdherentDto getOne(@PathVariable Long id) {
        return service.getConvention(authUtils.currentAdherent(), id);
    }

    @PostMapping("/demandes")
    public ConventionDemandeDto createDemande(@RequestBody ConventionDemandeRequest req) {
        return service.createDemande(authUtils.currentAdherent(), req);
    }

    @PostMapping("/demandes/{id}/cancel")
    public ConventionDemandeDto cancelDemande(@PathVariable Long id) {
        return service.cancelDemande(authUtils.currentAdherent(), id);
    }
}
