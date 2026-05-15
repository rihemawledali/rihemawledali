package com.project_pfe_srt.project_srt.treasurer.ticket.controller;

import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketAssignRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.service.TicketRestaurantService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/treasurer/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerTicketController {

    private final TicketRestaurantService service;

    @GetMapping
    public Object list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Long id) {
        return service.getById(id);
    }

    /** List the tickets generated from a given bon de commande. */
    @GetMapping("/by-bon/{bonId}")
    public Object listByBon(@PathVariable Long bonId) {
        return service.listByBon(bonId);
    }

    /** Assign the next N unassigned tickets of a validated bon to one adhérent. */
    @PostMapping("/assign")
    public Object assign(@RequestBody TicketAssignRequest req) {
        return service.assignFromBon(req);
    }

    @PostMapping
    public Object create(@RequestBody TicketRestaurantRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public Object update(@PathVariable Long id, @RequestBody TicketRestaurantRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Object delete(@PathVariable Long id) {
        service.delete(id);
        return Map.of("message", "Ticket supprimé.");
    }
}
