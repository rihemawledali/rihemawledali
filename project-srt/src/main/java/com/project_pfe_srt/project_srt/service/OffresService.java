package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.TicketDto;
import com.project_pfe_srt.project_srt.entity.BonCommande;
import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OffresService {

    private final TicketRepository ticketRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final RetenueService retenueService;

    public List<TicketDto> listMyTickets(User user) {
        return ticketRepository.findByAdherentIdOrderByDateEmissionDesc(user.getId())
                .stream().map(TicketDto::from).toList();
    }

    @Transactional
    public TicketDto acceptTicket(User user, Long ticketId) {
        TicketRestaurant ticket = findAssignedTicketForUser(user, ticketId);
        if (!"attribue".equalsIgnoreCase(ticket.getStatut())) {
            throw new IllegalArgumentException("Ce ticket a déjà une décision.");
        }

        LocalDate today = LocalDate.now();
        ticket.setStatut("utilise");
        ticket.setDateDecision(today);
        TicketRestaurant saved = ticketRepository.save(ticket);
        retenueService.refreshForAdherent(user, today.getMonthValue(), today.getYear());
        return TicketDto.from(saved);
    }

    @Transactional
    public TicketDto rejectTicket(User user, Long ticketId) {
        TicketRestaurant ticket = findAssignedTicketForUser(user, ticketId);
        if (!"attribue".equalsIgnoreCase(ticket.getStatut())) {
            throw new IllegalArgumentException("Ce ticket a déjà une décision.");
        }

        BonCommande bon = ticket.getBonCommande();
        ticket.setStatut("en_attente");
        ticket.setAdherent(null);
        ticket.setDateAttribution(null);
        ticket.setDateDecision(null);
        TicketRestaurant saved = ticketRepository.save(ticket);

        if (bon != null) {
            int remaining = bon.getQuantiteRestante() == null ? 0 : bon.getQuantiteRestante();
            int total = bon.getQuantiteTotale() == null ? remaining + 1 : bon.getQuantiteTotale();
            bon.setQuantiteRestante(Math.min(total, remaining + 1));
            if ("epuise".equalsIgnoreCase(bon.getStatut()) && bon.getQuantiteRestante() > 0) {
                bon.setStatut("valide");
            }
            bonCommandeRepository.save(bon);
        }

        return TicketDto.from(saved);
    }

    private TicketRestaurant findAssignedTicketForUser(User user, Long ticketId) {
        TicketRestaurant ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable."));
        if (ticket.getAdherent() == null || !ticket.getAdherent().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Ce ticket ne vous est pas attribué.");
        }
        return ticket;
    }
}
