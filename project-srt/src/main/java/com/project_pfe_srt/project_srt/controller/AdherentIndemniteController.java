package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.IndemniteRequest;
import com.project_pfe_srt.project_srt.service.IndemniteService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/indemnites")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentIndemniteController {

    private final IndemniteService indemniteService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(indemniteService.listMine(authUtils.currentAdherent()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody IndemniteRequest req) {
        try {
            return ResponseEntity.ok(indemniteService.create(authUtils.currentAdherent(), req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
