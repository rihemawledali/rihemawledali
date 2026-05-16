package com.project_pfe_srt.project_srt.adherent.historique.controller;

import com.project_pfe_srt.project_srt.adherent.historique.dto.HistoriqueDto;
import com.project_pfe_srt.project_srt.adherent.historique.service.HistoriqueService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adherent/historique")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentHistoriqueController {

    private final HistoriqueService historiqueService;
    private final AuthUtils authUtils;

    @GetMapping
    public List<HistoriqueDto> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return historiqueService.search(authUtils.currentAdherent(), type, dateDebut, dateFin);
    }
}
