package com.project_pfe_srt.project_srt.adherent.profile.dto;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.historique.dto.HistoriqueDto;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDto {
    private AdherentProfileDto profile;
    private AdhesionDto adhesion;
    private PretDto activeLoan;
    private long pendingIndemnities;
    private long availableOffers;
    private List<HistoriqueDto> recentHistory;
    private List<MonthPoint> financialChart;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthPoint {
        private String month; // ISO yyyy-MM
        private double solde;
    }
}
