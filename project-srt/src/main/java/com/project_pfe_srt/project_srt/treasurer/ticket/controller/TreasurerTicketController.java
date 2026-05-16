package com.project_pfe_srt.project_srt.treasurer.ticket.controller;

import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketAssignRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.service.TicketRestaurantService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerTicketController {

    private final TicketRestaurantService service;

    @GetMapping
    public List<TicketDto> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public TicketDto get(@PathVariable Long id) {
        return service.getById(id);
    }

    /** List the tickets generated from a given bon de commande. */
    @GetMapping("/by-bon/{bonId}")
    public List<TicketDto> listByBon(@PathVariable Long bonId) {
        return service.listByBon(bonId);
    }

    /** Assign the next N unassigned tickets of a validated bon to one adhérent. */
    @PostMapping("/assign")
    public List<TicketDto> assign(@RequestBody TicketAssignRequest req) {
        return service.assignFromBon(req);
    }

    @PostMapping
    public TicketDto create(@RequestBody TicketRestaurantRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public TicketDto update(@PathVariable Long id, @RequestBody TicketRestaurantRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        service.delete(id);
        return Map.of("message", "Ticket supprimé.");
    }
}
