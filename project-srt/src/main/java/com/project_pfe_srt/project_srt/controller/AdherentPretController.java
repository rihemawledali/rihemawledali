package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.PretRequest;
import com.project_pfe_srt.project_srt.service.PretService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/prets")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentPretController {

    private final PretService pretService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(pretService.listMine(authUtils.currentAdherent()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PretRequest req) {
        try {
            return ResponseEntity.ok(pretService.create(authUtils.currentAdherent(), req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
