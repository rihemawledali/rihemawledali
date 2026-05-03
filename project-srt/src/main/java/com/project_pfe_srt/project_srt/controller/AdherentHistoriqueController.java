package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.service.HistoriqueService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/historique")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentHistoriqueController {

    private final HistoriqueService historiqueService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin
    ) {
        try {
            return ResponseEntity.ok(
                    historiqueService.search(authUtils.currentAdherent(), type, dateDebut, dateFin));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
