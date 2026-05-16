package com.project_pfe_srt.project_srt.admin.dashboard.controller;

import com.project_pfe_srt.project_srt.admin.dashboard.dto.AdminDashboardStatsDto;
import com.project_pfe_srt.project_srt.admin.dashboard.service.AdminDashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/stats")
    public AdminDashboardStatsDto stats() {
        return dashboardService.stats();
    }
}
