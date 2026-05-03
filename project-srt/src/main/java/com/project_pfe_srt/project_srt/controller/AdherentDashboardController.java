package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.service.DashboardService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/adherent/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentDashboardController {

    private final DashboardService dashboardService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok(dashboardService.build(authUtils.currentAdherent()));
    }
}
