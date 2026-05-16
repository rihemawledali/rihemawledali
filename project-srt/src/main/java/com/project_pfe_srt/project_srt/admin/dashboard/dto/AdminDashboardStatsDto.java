package com.project_pfe_srt.project_srt.admin.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardStatsDto {
    private long totalAdherents;
    private long pretsActifs;
    private double revenuTotal;
    private long demandesEnAttente;
    private long fournisseursActifs;
    private double trendAdherents;
    private double trendRevenu;
    private double trendPrets;
    private double trendDemandes;
}
