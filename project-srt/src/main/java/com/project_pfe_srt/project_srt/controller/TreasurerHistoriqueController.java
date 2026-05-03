package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.service.HistoriqueTresorerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/treasurer/historique")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerHistoriqueController {

    private final HistoriqueTresorerieService service;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return ResponseEntity.ok(service.search(type, sourceType, from, to));
    }
}
