package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.service.OffresService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/offres")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentOffresController {

    private final OffresService offresService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(Map.of(
                "tickets", offresService.listMyTickets(authUtils.currentAdherent())
        ));
    }
}
