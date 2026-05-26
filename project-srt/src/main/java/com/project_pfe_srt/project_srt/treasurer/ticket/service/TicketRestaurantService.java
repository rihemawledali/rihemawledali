package com.project_pfe_srt.project_srt.treasurer.ticket.service;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketAssignRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketRestaurantRequest;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Treasury-side service for ticket restaurant assignment rows. A row
 * represents a quantity assigned from a bon to one adhérent.
 */
@Service
@RequiredArgsConstructor
public class TicketRestaurantService {

    private static final Set<String> TYPES = Set.of("restaurant", "cafeteria");
    private static final Set<String> STATUTS = Set.of("en_attente", "attribue", "utilise", "expire");

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final BonCommandeRepository bonCommandeRepository;

    // =====================================================================
    // Read
    // =====================================================================

    public List<TicketDto> list() {
        return ticketRepository.findAllByOrderByDateEmissionDesc()
                .stream().filter(TicketRestaurantService::isAssignmentRow)
                .map(TicketDto::from).toList();
    }

    public TicketDto getById(Long id) {
        return TicketDto.from(findTicket(id));
    }

    public List<TicketDto> listByBon(Long bonCommandeId) {
        return ticketRepository.findByBonCommandeIdOrderByNumeroAsc(bonCommandeId)
                .stream().filter(TicketRestaurantService::isAssignmentRow)
                .map(TicketDto::from).toList();
    }

    // =====================================================================
    // Assignment
    // =====================================================================

    /**
     * Assigns a quantity of tickets from the given validated bon to a
     * single adhérent. Atomically updates the bon's
     * {@code quantiteRestante} and flips it to {@code epuise} when stock
     * reaches zero.
     */
    @Transactional
    public List<TicketDto> assignFromBon(TicketAssignRequest req) {
        if (req.getBonCommandeId() == null) throw new IllegalArgumentException("Bon de commande requis.");
        if (req.getAdherentId() == null) throw new IllegalArgumentException("Adhérent requis.");
        if (req.getQuantite() == null || req.getQuantite() <= 0) {
            throw new IllegalArgumentException("Quantité invalide.");
        }

        BonCommande bon = Repos.findOrThrow(bonCommandeRepository, req.getBonCommandeId(), "Bon de commande");
        ensureBonReadyForAssignment(bon);

        User adherent = Repos.findOrThrow(userRepository, req.getAdherentId(), "Adhérent");
        ensureRoleAdherent(adherent);

        int asked = req.getQuantite();
        int stock = bon.getQuantiteRestante() == null ? 0 : bon.getQuantiteRestante();
        if (asked > stock) {
            throw new IllegalArgumentException("Stock insuffisant : " + stock + " ticket(s) disponible(s).");
        }

        LocalDate today = LocalDate.now();
        String assignmentBatchId = UUID.randomUUID().toString();
        TicketRestaurant assignment = TicketRestaurant.builder()
                .numero(nextAssignmentNumero(bon))
                .typeBon(bon.getTypeBon())
                .montant(bon.getValeurUnitaire())
                .quantite(asked)
                .statut("attribue")
                .adherent(adherent)
                .bonCommande(bon)
                .dateEmission(today)
                .dateAttribution(today)
                .assignmentBatchId(assignmentBatchId)
                .build();

        int remaining = stock - asked;
        bon.setQuantiteRestante(remaining);
        if (remaining == 0) bon.setStatut("epuise");
        bonCommandeRepository.save(bon);
        return List.of(TicketDto.from(ticketRepository.save(assignment)));
    }

    // =====================================================================
    // Create / update / delete
    // =====================================================================

    public TicketDto create(TicketRestaurantRequest req) {
        String numero = Validators.requireNonBlank(req.getNumero(), "Numéro");
        if (ticketRepository.existsByNumero(numero)) {
            throw new IllegalArgumentException("Numéro déjà utilisé.");
        }
        String type = Validators.requireOneOfLower(TYPES, req.getTypeBon(), "Type de bon");
        double montant = Validators.requirePositive(req.getMontant(), "Montant");
        int quantite = req.getQuantite() == null ? 1 : requirePositiveQuantity(req.getQuantite());
        String statut = req.getStatut() == null
                ? "attribue"
                : Validators.requireOneOfLower(STATUTS, req.getStatut(), "Statut");

        User adherent = null;
        if (req.getAdherentId() != null) {
            adherent = Repos.findOrThrow(userRepository, req.getAdherentId(), "Adhérent");
            ensureRoleAdherent(adherent);
        }

        LocalDate date = DateParser.parseIsoDateOrDefault(req.getDateEmission(), LocalDate.now());

        TicketRestaurant t = TicketRestaurant.builder()
                .numero(numero)
                .typeBon(type)
                .montant(montant)
                .quantite(quantite)
                .statut(statut)
                .adherent(adherent)
                .dateEmission(date)
                .build();
        return TicketDto.from(ticketRepository.save(t));
    }

    public TicketDto update(Long id, TicketRestaurantRequest req) {
        TicketRestaurant t = findTicket(id);
        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(t.getNumero())) {
            if (ticketRepository.existsByNumero(req.getNumero())) {
                throw new IllegalArgumentException("Numéro déjà utilisé.");
            }
            t.setNumero(req.getNumero());
        }
        if (req.getTypeBon() != null) {
            t.setTypeBon(Validators.requireOneOfLower(TYPES, req.getTypeBon(), "Type de bon"));
        }
        if (req.getMontant() != null) {
            t.setMontant(Validators.requirePositive(req.getMontant(), "Montant"));
        }
        if (req.getQuantite() != null) {
            t.setQuantite(requirePositiveQuantity(req.getQuantite()));
        }
        if (req.getStatut() != null) {
            t.setStatut(Validators.requireOneOfLower(STATUTS, req.getStatut(), "Statut"));
        }
        if (req.getAdherentId() != null) {
            t.setAdherent(Repos.findOrThrow(userRepository, req.getAdherentId(), "Adhérent"));
        }
        return TicketDto.from(ticketRepository.save(t));
    }

    public void delete(Long id) {
        if (!ticketRepository.existsById(id)) throw NotFoundException.of("Ticket");
        ticketRepository.deleteById(id);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private TicketRestaurant findTicket(Long id) {
        return Repos.findOrThrow(ticketRepository, id, "Ticket");
    }

    private String nextAssignmentNumero(BonCommande bon) {
        String numero;
        do {
            numero = bon.getNumero() + "-A-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (ticketRepository.existsByNumero(numero));
        return numero;
    }

    private static int requirePositiveQuantity(Integer value) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("Quantité invalide.");
        }
        return value;
    }

    private void ensureBonReadyForAssignment(BonCommande bon) {
        String statut = bon.getStatut() == null ? "" : bon.getStatut().toLowerCase();
        if (!"valide".equals(statut)) {
            throw new IllegalArgumentException(
                    "Le bon doit être validé avant d'attribuer des tickets (statut actuel : "
                            + statut + ").");
        }
        if (bon.getDateExpiration() != null && bon.getDateExpiration().isBefore(LocalDate.now())) {
            bon.setStatut("expire");
            bonCommandeRepository.save(bon);
            throw new IllegalArgumentException("Ce bon est expiré.");
        }
    }

    private static void ensureRoleAdherent(User user) {
        if (user.getRole() != Role.ADHERENT) {
            throw new IllegalArgumentException("L'utilisateur n'est pas un adhérent.");
        }
    }

    private static boolean isAssignmentRow(TicketRestaurant ticket) {
        return ticket.getAdherent() != null
                || ticket.getDateAttribution() != null
                || ticket.getDateDecision() != null;
    }
}
