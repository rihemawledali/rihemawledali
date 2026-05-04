package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.TicketAssignRequest;
import com.project_pfe_srt.project_srt.dto.TicketDto;
import com.project_pfe_srt.project_srt.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.entity.BonCommande;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
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
    private final BonCommandeRepository bonCommandeRepository;

    public List<TicketDto> list() {
        return ticketRepository.findAllByOrderByDateEmissionDesc()
                .stream().map(TicketDto::from).toList();
    }

    public TicketDto getById(Long id) {
        return ticketRepository.findById(id)
                .map(TicketDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable."));
    }

    public List<TicketDto> listByBon(Long bonCommandeId) {
        return ticketRepository.findByBonCommandeIdOrderByNumeroAsc(bonCommandeId)
                .stream().map(TicketDto::from).toList();
    }

    /**
     * Assigns the next N unassigned tickets of the given (validated) bon
     * to a single adhérent. Atomically updates the bon's
     * {@code quantiteRestante} and flips it to {@code epuise} when the
     * stock reaches zero.
     */
    @Transactional
    public List<TicketDto> assignFromBon(TicketAssignRequest req) {
        if (req.getBonCommandeId() == null)
            throw new IllegalArgumentException("Bon de commande requis.");
        if (req.getAdherentId() == null)
            throw new IllegalArgumentException("Adhérent requis.");
        if (req.getQuantite() == null || req.getQuantite() <= 0)
            throw new IllegalArgumentException("Quantité invalide.");

        BonCommande bon = bonCommandeRepository.findById(req.getBonCommandeId())
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));
        String bonStatut = bon.getStatut() == null ? "" : bon.getStatut().toLowerCase();
        if (!"valide".equals(bonStatut)) {
            throw new IllegalArgumentException(
                    "Le bon doit être validé avant d'attribuer des tickets (statut actuel : "
                            + bonStatut + ").");
        }
        if (bon.getDateExpiration() != null && bon.getDateExpiration().isBefore(LocalDate.now())) {
            bon.setStatut("expire");
            bonCommandeRepository.save(bon);
            throw new IllegalArgumentException("Ce bon est expiré.");
        }

        User adherent = userRepository.findById(req.getAdherentId())
                .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
        if (adherent.getRole() != Role.ADHERENT)
            throw new IllegalArgumentException("L'utilisateur n'est pas un adhérent.");

        int asked = req.getQuantite();
        int stock = bon.getQuantiteRestante() == null ? 0 : bon.getQuantiteRestante();
        if (asked > stock) {
            throw new IllegalArgumentException(
                    "Stock insuffisant : " + stock + " ticket(s) disponible(s).");
        }

        List<TicketRestaurant> next = ticketRepository
                .findByBonCommandeIdAndStatutOrderByNumeroAsc(
                        bon.getId(), "en_attente", PageRequest.of(0, asked));
        if (next.size() < asked) {
            // Should not happen when quantiteRestante is consistent, but stay safe.
            throw new IllegalArgumentException(
                    "Stock incohérent : seulement " + next.size() + " ticket(s) libre(s) trouvé(s).");
        }
        LocalDate today = LocalDate.now();
        List<TicketDto> result = new ArrayList<>(next.size());
        for (TicketRestaurant t : next) {
            t.setAdherent(adherent);
            t.setStatut("attribue");
            t.setDateAttribution(today);
            result.add(TicketDto.from(ticketRepository.save(t)));
        }

        int remaining = stock - asked;
        bon.setQuantiteRestante(remaining);
        if (remaining == 0) bon.setStatut("epuise");
        bonCommandeRepository.save(bon);

        return result;
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
