package com.project_pfe_srt.project_srt.adherent.offres.controller;

import com.project_pfe_srt.project_srt.adherent.offres.service.OffresService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adherent/offres")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentOffresController {

    private final OffresService offresService;
    private final AuthUtils authUtils;

    @GetMapping
    public Map<String, List<TicketDto>> list() {
        return Map.of("tickets", offresService.listMyTickets(authUtils.currentAdherent()));
    }

    @PostMapping("/tickets/{id}/accept")
    public TicketDto acceptTicket(@PathVariable Long id) {
        return offresService.acceptTicket(authUtils.currentAdherent(), id);
    }

    @PostMapping("/tickets/{id}/reject")
    public TicketDto rejectTicket(@PathVariable Long id) {
        return offresService.rejectTicket(authUtils.currentAdherent(), id);
    }
}
