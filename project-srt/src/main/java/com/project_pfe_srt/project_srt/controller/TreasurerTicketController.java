package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.service.TicketRestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TicketRestaurantRequest req) {
        try {
            return ResponseEntity.ok(service.create(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TicketRestaurantRequest req) {
        try {
            return ResponseEntity.ok(service.update(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Ticket supprimé."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
