package com.project_pfe_srt.project_srt.treasurer.boncommande.service;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.treasurer.boncommande.dto.BonCommandeDetailDto;
import com.project_pfe_srt.project_srt.treasurer.boncommande.dto.BonCommandeDto;
import com.project_pfe_srt.project_srt.treasurer.boncommande.dto.BonCommandeRequest;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Manages "bon de commande" stock orders for restaurant / cafeteria
 * tickets. Creating a bon also pre-generates its tickets (in
 * {@code en_attente}, unassigned); validating the bon then opens
 * those tickets to assignment via {@link TicketRepository}.
 */
@Service
@RequiredArgsConstructor
public class BonCommandeService {

    private static final int MAX_TICKETS = 10_000;

    /** Includes legacy values for backwards compatibility. */
    private static final Set<String> STATUTS = Set.of(
            "en_attente", "attribue", "utilise",   // legacy
            "brouillon", "valide", "epuise", "expire");

    private static final Set<String> TYPES = Set.of("restaurant", "cafeteria");

    private final BonCommandeRepository repo;
    private final FournisseurRepository fournisseurRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    // =====================================================================
    // Read
    // =====================================================================

    public List<BonCommandeDto> list() {
        return repo.findAllByOrderByDateEmissionDesc().stream()
                .map(BonCommandeDto::from).toList();
    }

    public BonCommandeDetailDto getById(Long id) {
        BonCommande b = findBon(id);
        List<TicketDto> tickets = ticketRepository
                .findByBonCommandeIdOrderByNumeroAsc(b.getId()).stream()
                .map(TicketDto::from).toList();
        return BonCommandeDetailDto.builder()
                .bon(BonCommandeDto.from(b))
                .tickets(tickets)
                .build();
    }

    // =====================================================================
    // Create / update / delete
    // =====================================================================

    /**
     * Creates a stock-level bon and pre-generates all its tickets in
     * {@code en_attente}. The bon itself starts in {@code brouillon} —
     * call {@link #valider} to open tickets for assignment.
     */
    @Transactional
    public BonCommandeDto create(BonCommandeRequest req) {
        String numero = Validators.requireNonBlank(req.getNumero(), "Numéro");
        if (repo.existsByNumero(numero)) {
            throw new IllegalArgumentException("Numéro déjà utilisé.");
        }
        double montant = Validators.requirePositive(req.getMontant(), "Montant total");
        double valeurUnitaire = Validators.requirePositive(req.getValeurUnitaire(),
                "Valeur unitaire d'un ticket");
        if (req.getFournisseurId() == null) {
            throw new IllegalArgumentException("Fournisseur requis.");
        }

        int quantite = resolveQuantite(req.getQuantiteTotale(), montant, valeurUnitaire);
        Fournisseur fournisseur = Repos.findOrThrow(
                fournisseurRepository, req.getFournisseurId(), "Fournisseur");
        User adherent = resolveOptionalAdherent(req.getAdherentId());

        LocalDate emission = DateParser.parseIsoDate(req.getDateEmission(), "d'émission");
        LocalDate expiration = DateParser.parseIsoDate(req.getDateExpiration(), "d'expiration");
        if (expiration.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'expiration doit être après la date d'émission.");
        }

        String typeBon = requireType(req.getTypeBon(), "restaurant");

        BonCommande saved = repo.save(BonCommande.builder()
                .numero(numero)
                .fournisseur(fournisseur)
                .adherent(adherent)
                .typeBon(typeBon)
                .montant(montant)
                .valeurUnitaire(valeurUnitaire)
                .quantiteTotale(quantite)
                .quantiteRestante(quantite)
                .statut(requireStatut(req.getStatut(), "brouillon"))
                .dateEmission(emission)
                .dateExpiration(expiration)
                .build());

        ticketRepository.saveAll(generateTickets(saved, quantite, valeurUnitaire, typeBon, emission));
        return BonCommandeDto.from(saved);
    }

    /** Move a {@code brouillon} bon to {@code valide}. Idempotent. */
    @Transactional
    public BonCommandeDto valider(Long id) {
        BonCommande b = findBon(id);
        String s = b.getStatut() == null ? "" : b.getStatut().toLowerCase();
        if ("epuise".equals(s) || "expire".equals(s)) {
            throw new IllegalArgumentException("Ce bon ne peut plus être validé (statut : " + s + ").");
        }
        b.setStatut("valide");
        return BonCommandeDto.from(repo.save(b));
    }

    @Transactional
    public BonCommandeDto update(Long id, BonCommandeRequest req) {
        BonCommande b = findBon(id);
        boolean hasAssignedTickets =
                ticketRepository.countByBonCommandeIdAndStatut(b.getId(), "attribue") > 0;

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(b.getNumero())) {
            if (repo.existsByNumero(req.getNumero())) {
                throw new IllegalArgumentException("Numéro déjà utilisé.");
            }
            b.setNumero(req.getNumero());
        }
        if (req.getFournisseurId() != null) {
            b.setFournisseur(Repos.findOrThrow(fournisseurRepository, req.getFournisseurId(), "Fournisseur"));
        }
        if (req.getAdherentId() != null) {
            b.setAdherent(Repos.findOrThrow(userRepository, req.getAdherentId(), "Adhérent"));
        }
        if (req.getTypeBon() != null) {
            b.setTypeBon(requireType(req.getTypeBon(), b.getTypeBon()));
        }
        if (req.getMontant() != null) {
            double montant = Validators.requirePositive(req.getMontant(), "Montant");
            if (hasAssignedTickets && !req.getMontant().equals(b.getMontant())) {
                throw new IllegalArgumentException(
                        "Impossible de modifier le montant : des tickets ont déjà été attribués.");
            }
            b.setMontant(montant);
        }
        if (req.getStatut() != null) b.setStatut(requireStatut(req.getStatut(), b.getStatut()));
        if (req.getDateEmission() != null) b.setDateEmission(DateParser.parseIsoDate(req.getDateEmission(), "d'émission"));
        if (req.getDateExpiration() != null) b.setDateExpiration(DateParser.parseIsoDate(req.getDateExpiration(), "d'expiration"));

        return BonCommandeDto.from(repo.save(b));
    }

    @Transactional
    public void delete(Long id) {
        BonCommande b = findBon(id);
        long assigned = ticketRepository.countByBonCommandeIdAndStatut(b.getId(), "attribue");
        if (assigned > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer : " + assigned + " ticket(s) déjà attribué(s).");
        }
        ticketRepository.deleteAll(ticketRepository.findByBonCommandeIdOrderByNumeroAsc(b.getId()));
        repo.deleteById(b.getId());
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private BonCommande findBon(Long id) {
        return Repos.findOrThrow(repo, id, "Bon de commande");
    }

    private User resolveOptionalAdherent(Long adherentId) {
        if (adherentId == null) return null;
        User a = Repos.findOrThrow(userRepository, adherentId, "Adhérent");
        if (a.getRole() != Role.ADHERENT) {
            throw new IllegalArgumentException("L'utilisateur sélectionné n'est pas un adhérent.");
        }
        return a;
    }

    /**
     * Derives the ticket count when omitted, sanity-checking that the
     * money totals are consistent. Rejects ratios like 1000 DT / 7 DT.
     */
    private static int resolveQuantite(Integer requested, double montant, double valeurUnitaire) {
        int quantite;
        if (requested != null && requested > 0) {
            quantite = requested;
        } else {
            double raw = montant / valeurUnitaire;
            if (Math.abs(raw - Math.round(raw)) > 1e-6) {
                throw new IllegalArgumentException(
                        "Le montant total doit être un multiple exact de la valeur unitaire.");
            }
            quantite = (int) Math.round(raw);
        }
        if (quantite <= 0 || quantite > MAX_TICKETS) {
            throw new IllegalArgumentException("Quantité de tickets hors plage (1.." + MAX_TICKETS + ").");
        }
        return quantite;
    }

    /**
     * Pre-generates {@code quantite} tickets numbered {@code <bonNumero>-0001 …}.
     * The bon's unique numero guarantees ticket numero uniqueness.
     */
    private static List<TicketRestaurant> generateTickets(
            BonCommande bon, int quantite, double valeurUnitaire,
            String typeBon, LocalDate emission) {

        List<TicketRestaurant> tickets = new ArrayList<>(quantite);
        for (int i = 1; i <= quantite; i++) {
            tickets.add(TicketRestaurant.builder()
                    .numero(bon.getNumero() + "-" + String.format("%04d", i))
                    .typeBon(typeBon)
                    .montant(valeurUnitaire)
                    .statut("en_attente")
                    .bonCommande(bon)
                    .dateEmission(emission)
                    .build());
        }
        return tickets;
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return Validators.requireOneOfLower(STATUTS, value, "Statut");
    }

    private static String requireType(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!TYPES.contains(v)) {
            throw new IllegalArgumentException("Type de bon invalide (restaurant | cafeteria).");
        }
        return v;
    }
}
