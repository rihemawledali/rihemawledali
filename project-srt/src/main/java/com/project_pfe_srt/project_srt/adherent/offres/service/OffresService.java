package com.project_pfe_srt.project_srt.adherent.offres.service;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OffresService {

    private static final String STATUT_ATTRIBUE = "attribue";
    private static final String STATUT_EN_ATTENTE = "en_attente";
    private static final String STATUT_UTILISE = "utilise";
    private static final String BON_STATUT_EPUISE = "epuise";
    private static final String BON_STATUT_VALIDE = "valide";

    private final TicketRepository ticketRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final RetenueService retenueService;

    public List<TicketDto> listMyTickets(User user) {
        return ticketRepository.findByAdherentIdOrderByDateEmissionDesc(user.getId()).stream()
                .map(TicketDto::from)
                .toList();
    }

    @Transactional
    public TicketDto acceptTicket(User user, Long ticketId) {
        TicketRestaurant ticket = findTicketWaitingForDecision(user, ticketId);
        LocalDate today = LocalDate.now();

        ticket.setStatut(STATUT_UTILISE);
        ticket.setDateDecision(today);

        TicketRestaurant saved = ticketRepository.save(ticket);
        retenueService.refreshForAdherent(user, today.getMonthValue(), today.getYear());
        return TicketDto.from(saved);
    }

    @Transactional
    public TicketDto rejectTicket(User user, Long ticketId) {
        TicketRestaurant ticket = findTicketWaitingForDecision(user, ticketId);

        releaseTicket(ticket);
        TicketRestaurant saved = ticketRepository.save(ticket);
        restoreBonStock(ticket.getBonCommande());

        return TicketDto.from(saved);
    }

    private TicketRestaurant findTicketWaitingForDecision(User user, Long ticketId) {
        TicketRestaurant ticket = Repos.findOrThrow(ticketRepository, ticketId, "Ticket");
        requireTicketAssignedToUser(ticket, user);
        requireTicketStillWaiting(ticket);
        return ticket;
    }

    private static void requireTicketAssignedToUser(TicketRestaurant ticket, User user) {
        if (ticket.getAdherent() == null || !ticket.getAdherent().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Ce ticket ne vous est pas attribu\u00e9.");
        }
    }

    private static void requireTicketStillWaiting(TicketRestaurant ticket) {
        if (!STATUT_ATTRIBUE.equalsIgnoreCase(ticket.getStatut())) {
            throw new IllegalArgumentException("Ce ticket a d\u00e9j\u00e0 une d\u00e9cision.");
        }
    }

    private static void releaseTicket(TicketRestaurant ticket) {
        ticket.setStatut(STATUT_EN_ATTENTE);
        ticket.setAdherent(null);
        ticket.setDateAttribution(null);
        ticket.setDateDecision(null);
    }

    private void restoreBonStock(BonCommande bon) {
        if (bon == null) {
            return;
        }

        int remaining = bon.getQuantiteRestante() == null ? 0 : bon.getQuantiteRestante();
        int total = bon.getQuantiteTotale() == null ? remaining + 1 : bon.getQuantiteTotale();
        bon.setQuantiteRestante(Math.min(total, remaining + 1));

        if (BON_STATUT_EPUISE.equalsIgnoreCase(bon.getStatut()) && bon.getQuantiteRestante() > 0) {
            bon.setStatut(BON_STATUT_VALIDE);
        }
        bonCommandeRepository.save(bon);
    }
}
