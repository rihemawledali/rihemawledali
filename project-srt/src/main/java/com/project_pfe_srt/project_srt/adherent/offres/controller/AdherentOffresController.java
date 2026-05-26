package com.project_pfe_srt.project_srt.adherent.offres.controller;

import com.project_pfe_srt.project_srt.adherent.offres.dto.TicketAssignmentDto;
import com.project_pfe_srt.project_srt.adherent.offres.service.OffresService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adherent/offres")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentOffresController {

    private final OffresService offresService;
    private final AuthUtils authUtils;

    @GetMapping
    public Map<String, Object> list() {
        var adherent = authUtils.currentAdherent();
        return Map.of(
                "tickets", offresService.listMyTickets(adherent),
                "ticketAssignments", offresService.listMyTicketAssignments(adherent));
    }

    @PostMapping("/tickets/{id}/accept")
    public TicketDto acceptTicket(@PathVariable Long id) {
        return offresService.acceptTicket(authUtils.currentAdherent(), id);
    }

    @PostMapping("/tickets/{id}/reject")
    public TicketDto rejectTicket(@PathVariable Long id) {
        return offresService.rejectTicket(authUtils.currentAdherent(), id);
    }

    @PostMapping("/ticket-assignments/{id}/accept")
    public TicketAssignmentDto acceptTicketAssignment(@PathVariable String id) {
        return offresService.acceptTicketAssignment(authUtils.currentAdherent(), id);
    }

    @PostMapping("/ticket-assignments/{id}/reject")
    public TicketAssignmentDto rejectTicketAssignment(@PathVariable String id) {
        return offresService.rejectTicketAssignment(authUtils.currentAdherent(), id);
    }
}
