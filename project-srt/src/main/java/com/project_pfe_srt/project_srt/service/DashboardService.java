package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.*;
import com.project_pfe_srt.project_srt.entity.HistoriqueFinanciere;
import com.project_pfe_srt.project_srt.entity.PretSocial;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.HistoriqueRepository;
import com.project_pfe_srt.project_srt.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.repository.PretRepository;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AdherentProfileService profileService;
    private final AdhesionService adhesionService;
    private final PretRepository pretRepository;
    private final IndemniteRepository indemniteRepository;
    private final TicketRepository ticketRepository;
    private final HistoriqueRepository historiqueRepository;

    public DashboardDto build(User user) {
        AdherentProfileDto profile = profileService.getProfileDto(user);
        AdhesionDto adhesion = adhesionService.getCurrent(user);

        PretSocial activeLoan = pretRepository
                .findByAdherentIdOrderByDateDemandeDesc(user.getId()).stream()
                .filter(p -> "en_cours".equals(p.getStatut()))
                .findFirst().orElse(null);

        long pendingIndemnities = indemniteRepository
                .countByAdherentIdAndStatut(user.getId(), "en_attente");
        long availableOffers = ticketRepository
                .countByAdherentIdAndStatut(user.getId(), "attribue");

        List<HistoriqueFinanciere> all = historiqueRepository
                .findByAdherentIdOrderByDateDesc(user.getId());

        List<HistoriqueDto> recent = all.stream()
                .limit(5)
                .map(HistoriqueDto::from)
                .toList();

        // 12-month sliding window of cumulative net amount.
        YearMonth thisMonth = YearMonth.now();
        List<DashboardDto.MonthPoint> chart = new ArrayList<>();
        double running = 0;
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = thisMonth.minusMonths(i);
            LocalDate from = ym.atDay(1);
            LocalDate to = ym.atEndOfMonth();
            double net = all.stream()
                    .filter(h -> !h.getDate().isBefore(from) && !h.getDate().isAfter(to))
                    .mapToDouble(HistoriqueFinanciere::getMontant)
                    .sum();
            running += net;
            chart.add(DashboardDto.MonthPoint.builder()
                    .month(ym.toString())
                    .solde(Math.round(running * 100.0) / 100.0)
                    .build());
        }

        return DashboardDto.builder()
                .profile(profile)
                .adhesion(adhesion)
                .activeLoan(PretDto.from(activeLoan))
                .pendingIndemnities(pendingIndemnities)
                .availableOffers(availableOffers)
                .recentHistory(recent)
                .financialChart(chart)
                .build();
    }
}
