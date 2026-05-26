package com.project_pfe_srt.project_srt.adherent.offres.service;

import com.project_pfe_srt.project_srt.adherent.offres.dto.TicketAssignmentDto;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OffresService {

    private static final String BATCH_PREFIX = "batch_";
    private static final String LEGACY_PREFIX = "legacy_";
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

    public List<TicketAssignmentDto> listMyTicketAssignments(User user) {
        Map<String, List<TicketRestaurant>> groups = new LinkedHashMap<>();
        for (TicketRestaurant ticket : ticketRepository.findByAdherentIdOrderByDateEmissionDesc(user.getId())) {
            groups.computeIfAbsent(groupId(ticket), ignored -> new ArrayList<>()).add(ticket);
        }
        return groups.entrySet().stream()
                .map(entry -> TicketAssignmentDto.from(entry.getKey(), entry.getValue()))
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
    public TicketAssignmentDto acceptTicketAssignment(User user, String groupId) {
        List<TicketRestaurant> tickets = findTicketGroupWaitingForDecision(user, groupId);
        LocalDate today = LocalDate.now();

        for (TicketRestaurant ticket : tickets) {
            ticket.setStatut(STATUT_UTILISE);
            ticket.setDateDecision(today);
        }

        List<TicketRestaurant> saved = ticketRepository.saveAll(tickets);
        retenueService.refreshForAdherent(user, today.getMonthValue(), today.getYear());
        return TicketAssignmentDto.from(groupId, saved);
    }

    @Transactional
    public TicketAssignmentDto rejectTicketAssignment(User user, String groupId) {
        List<TicketRestaurant> tickets = findTicketGroupWaitingForDecision(user, groupId);
        Map<BonCommande, Integer> restoredByBon = new LinkedHashMap<>();

        for (TicketRestaurant ticket : tickets) {
            if (ticket.getBonCommande() != null) {
                restoredByBon.merge(ticket.getBonCommande(), quantityOf(ticket), Integer::sum);
            }
            releaseTicket(ticket);
        }

        List<TicketRestaurant> saved = ticketRepository.saveAll(tickets);
        restoredByBon.forEach(this::restoreBonStock);
        return TicketAssignmentDto.from(groupId, saved);
    }

    @Transactional
    public TicketDto rejectTicket(User user, Long ticketId) {
        TicketRestaurant ticket = findTicketWaitingForDecision(user, ticketId);

        releaseTicket(ticket);
        TicketRestaurant saved = ticketRepository.save(ticket);
        restoreBonStock(ticket.getBonCommande(), quantityOf(ticket));

        return TicketDto.from(saved);
    }

    private TicketRestaurant findTicketWaitingForDecision(User user, Long ticketId) {
        TicketRestaurant ticket = Repos.findOrThrow(ticketRepository, ticketId, "Ticket");
        requireTicketAssignedToUser(ticket, user);
        requireTicketStillWaiting(ticket);
        return ticket;
    }

    private List<TicketRestaurant> findTicketGroupWaitingForDecision(User user, String groupId) {
        if (groupId == null || groupId.isBlank()) {
            throw new IllegalArgumentException("Groupe de tickets requis.");
        }

        List<TicketRestaurant> tickets;
        if (groupId.startsWith(BATCH_PREFIX)) {
            String batchId = groupId.substring(BATCH_PREFIX.length());
            tickets = ticketRepository.findByAdherentIdAndAssignmentBatchIdAndStatutOrderByNumeroAsc(
                    user.getId(), batchId, STATUT_ATTRIBUE);
        } else {
            tickets = ticketRepository.findByAdherentIdOrderByDateEmissionDesc(user.getId()).stream()
                    .filter(ticket -> STATUT_ATTRIBUE.equalsIgnoreCase(ticket.getStatut()))
                    .filter(ticket -> groupId(ticket).equals(groupId))
                    .toList();
        }

        if (tickets.isEmpty()) {
            throw new IllegalArgumentException("Ce lot de tickets n'est pas disponible pour d\u00e9cision.");
        }
        tickets.forEach(ticket -> requireTicketAssignedToUser(ticket, user));
        tickets.forEach(OffresService::requireTicketStillWaiting);
        return tickets;
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

    private void restoreBonStock(BonCommande bon, int quantity) {
        if (bon == null) {
            return;
        }

        int remaining = bon.getQuantiteRestante() == null ? 0 : bon.getQuantiteRestante();
        int total = bon.getQuantiteTotale() == null ? remaining + quantity : bon.getQuantiteTotale();
        bon.setQuantiteRestante(Math.min(total, remaining + quantity));

        if (BON_STATUT_EPUISE.equalsIgnoreCase(bon.getStatut()) && bon.getQuantiteRestante() > 0) {
            bon.setStatut(BON_STATUT_VALIDE);
        }
        bonCommandeRepository.save(bon);
    }

    private static String groupId(TicketRestaurant ticket) {
        if (ticket.getAssignmentBatchId() != null && !ticket.getAssignmentBatchId().isBlank()) {
            return BATCH_PREFIX + ticket.getAssignmentBatchId();
        }
        BonCommande bon = ticket.getBonCommande();
        return LEGACY_PREFIX
                + "bon-" + (bon == null ? "none" : bon.getId())
                + "_date-" + safeDate(ticket.getDateAttribution())
                + "_type-" + safe(ticket.getTypeBon())
                + "_status-" + safe(ticket.getStatut())
                + "_decision-" + safeDate(ticket.getDateDecision());
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "none" : value.replaceAll("[^A-Za-z0-9.-]", "-");
    }

    private static String safeDate(LocalDate value) {
        return value == null ? "none" : value.toString();
    }

    private static int quantityOf(TicketRestaurant ticket) {
        return ticket.getQuantite() == null ? 1 : ticket.getQuantite();
    }
}
