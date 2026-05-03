package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.TicketDto;
import com.project_pfe_srt.project_srt.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Treasury-side service for ticket restaurant CRUD. The
 * adherent-side listing already exists; this complements it.
 */
@Service
@RequiredArgsConstructor
public class TicketRestaurantService {

    private static final Set<String> TYPES = Set.of("restaurant", "cafeteria");
    private static final Set<String> STATUTS = Set.of("en_attente", "attribue", "utilise", "expire");

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public List<TicketDto> list() {
        return ticketRepository.findAllByOrderByDateEmissionDesc()
                .stream().map(TicketDto::from).toList();
    }

    public TicketDto create(TicketRestaurantRequest req) {
        if (req.getNumero() == null || req.getNumero().isBlank())
            throw new IllegalArgumentException("Numéro requis.");
        if (ticketRepository.existsByNumero(req.getNumero()))
            throw new IllegalArgumentException("Numéro déjà utilisé.");
        String type = req.getTypeBon() == null ? "" : req.getTypeBon().toLowerCase();
        if (!TYPES.contains(type))
            throw new IllegalArgumentException("Type de bon invalide (restaurant | cafeteria).");
        if (req.getMontant() == null || req.getMontant() <= 0)
            throw new IllegalArgumentException("Montant invalide.");
        String statut = req.getStatut() == null ? "attribue" : req.getStatut().toLowerCase();
        if (!STATUTS.contains(statut))
            throw new IllegalArgumentException("Statut invalide.");

        User adherent = null;
        if (req.getAdherentId() != null) {
            adherent = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            if (adherent.getRole() != Role.ADHERENT)
                throw new IllegalArgumentException("L'utilisateur n'est pas un adhérent.");
        }

        LocalDate date;
        try {
            date = req.getDateEmission() == null
                    ? LocalDate.now()
                    : LocalDate.parse(req.getDateEmission().length() > 10
                            ? req.getDateEmission().substring(0, 10) : req.getDateEmission());
        } catch (Exception e) {
            throw new IllegalArgumentException("Date d'émission invalide.");
        }

        TicketRestaurant t = TicketRestaurant.builder()
                .numero(req.getNumero().trim())
                .typeBon(type)
                .montant(req.getMontant())
                .statut(statut)
                .adherent(adherent)
                .dateEmission(date)
                .build();
        return TicketDto.from(ticketRepository.save(t));
    }

    public TicketDto update(Long id, TicketRestaurantRequest req) {
        TicketRestaurant t = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable."));
        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(t.getNumero())) {
            if (ticketRepository.existsByNumero(req.getNumero()))
                throw new IllegalArgumentException("Numéro déjà utilisé.");
            t.setNumero(req.getNumero());
        }
        if (req.getTypeBon() != null) {
            String type = req.getTypeBon().toLowerCase();
            if (!TYPES.contains(type)) throw new IllegalArgumentException("Type de bon invalide.");
            t.setTypeBon(type);
        }
        if (req.getMontant() != null) {
            if (req.getMontant() <= 0) throw new IllegalArgumentException("Montant invalide.");
            t.setMontant(req.getMontant());
        }
        if (req.getStatut() != null) {
            String s = req.getStatut().toLowerCase();
            if (!STATUTS.contains(s)) throw new IllegalArgumentException("Statut invalide.");
            t.setStatut(s);
        }
        if (req.getAdherentId() != null) {
            User a = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            t.setAdherent(a);
        }
        return TicketDto.from(ticketRepository.save(t));
    }

    public void delete(Long id) {
        if (!ticketRepository.existsById(id)) throw new IllegalArgumentException("Ticket introuvable.");
        ticketRepository.deleteById(id);
    }
}
