package com.project_pfe_srt.project_srt.adherent.profile.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;
import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.adherent.profile.dto.AdherentProfileDto;
import com.project_pfe_srt.project_srt.adherent.profile.dto.DashboardDto;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AdherentProfileService profileService;
    private final AdhesionService adhesionService;
    private final PretRepository pretRepository;
    private final IndemniteRepository indemniteRepository;
    private final TicketRepository ticketRepository;

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

        return DashboardDto.builder()
                .profile(profile)
                .adhesion(adhesion)
                .activeLoan(PretDto.from(activeLoan))
                .pendingIndemnities(pendingIndemnities)
                .availableOffers(availableOffers)
                .build();
    }
}
